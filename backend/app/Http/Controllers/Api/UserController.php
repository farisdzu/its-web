<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserController extends Controller
{
    /**
     * Get all users with optional search and role filter
     * Includes pagination for scalability
     * Excludes admin users by default (admin tidak perlu di-assign ke org unit)
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        // Exclude admin users by default (unless explicitly requested)
        if (!$request->has('include_admin')) {
            $query->where('role', '!=', User::ROLE_ADMIN);
        }

        // Search filter
        if ($request->has('search') && $request->search) {
            $query->search($request->search);
        }

        // Role filter
        if ($request->has('role') && $request->role) {
            $query->byRole($request->role);
        }

        // Only get active users by default (unless explicitly requested)
        if (!$request->has('include_inactive')) {
            $query->active();
        }

        // Pagination for scalability (default 50 per page, max 100)
        $perPage = min((int) ($request->get('per_page', 50)), 100);
        $page = (int) $request->get('page', 1);

        // Select only needed fields to reduce response size
        $users = $query->select('id', 'name', 'email', 'username', 'phone', 'employee_id', 'role', 'org_unit_id', 'title', 'is_active')
            ->with('orgUnit:id,name') // Eager load to prevent N+1
            ->orderBy('name')
            ->paginate($perPage, ['*'], 'page', $page);

        $data = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'phone' => $user->phone,
                'employee_id' => $user->employee_id,
                'role' => $user->role,
                'org_unit_id' => $user->org_unit_id,
                'org_unit_name' => $user->orgUnit?->name,
                'title' => $user->title,
                'is_active' => $user->is_active,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Assign user to org unit
     */
    public function assign(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'org_unit_id' => ['required', 'exists:org_units,id'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $user->update([
            'org_unit_id' => $data['org_unit_id'],
            'title' => $data['title'] ?? null,
        ]);

        // Clear cache karena user_count berubah
        Cache::forget('org_units_tree');

        $user->load('orgUnit:id,name');

        return response()->json([
            'success' => true,
            'message' => 'User berhasil di-assign ke bagian.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'org_unit_id' => $user->org_unit_id,
                'org_unit_name' => $user->orgUnit?->name,
                'title' => $user->title,
            ],
        ]);
    }

    /**
     * Unassign user from org unit
     */
    public function unassign(User $user): JsonResponse
    {
        $user->update([
            'org_unit_id' => null,
            'title' => null,
        ]);

        // Clear cache karena user_count berubah
        Cache::forget('org_units_tree');

        return response()->json([
            'success' => true,
            'message' => 'User berhasil di-unassign dari bagian.',
        ]);
    }

    /**
     * Create a new user
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'username' => ['nullable', 'string', 'max:255', 'unique:users,username'],
            'phone' => ['nullable', 'string', 'max:20'],
            'employee_id' => ['nullable', 'string', 'max:255', 'unique:users,employee_id'],
            'role' => ['required', 'string', Rule::in([User::ROLE_ADMIN, User::ROLE_USER])],
            'password' => ['required', 'string', 'min:8'],
            'org_unit_id' => ['nullable', 'exists:org_units,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $data['username'] ?? null,
            'phone' => $data['phone'] ?? null,
            'employee_id' => $data['employee_id'] ?? null,
            'role' => $data['role'],
            'password' => Hash::make($data['password']),
            'org_unit_id' => $data['org_unit_id'] ?? null,
            'title' => $data['title'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        // Clear cache karena user_count berubah jika org_unit_id di-set
        if (isset($data['org_unit_id'])) {
            Cache::forget('org_units_tree');
        }

        $user->load('orgUnit:id,name');

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dibuat.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'phone' => $user->phone,
                'employee_id' => $user->employee_id,
                'role' => $user->role,
                'org_unit_id' => $user->org_unit_id,
                'org_unit_name' => $user->orgUnit?->name,
                'title' => $user->title,
                'is_active' => $user->is_active,
            ],
        ], 201);
    }

    /**
     * Update a user
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'username' => ['nullable', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'employee_id' => ['nullable', 'string', 'max:255', Rule::unique('users', 'employee_id')->ignore($user->id)],
            'role' => ['sometimes', 'required', 'string', Rule::in([User::ROLE_ADMIN, User::ROLE_USER])],
            'password' => ['nullable', 'string', 'min:8'],
            'org_unit_id' => ['nullable', 'exists:org_units,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        $updateData = array_filter($data, function ($key) {
            return $key !== 'password';
        }, ARRAY_FILTER_USE_KEY);

        if (isset($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        // Check if org_unit_id is being changed (affects user_count)
        $oldOrgUnitId = $user->org_unit_id;
        $newOrgUnitId = $updateData['org_unit_id'] ?? null;

        $user->update($updateData);

        // Clear cache jika org_unit_id berubah (dari null ke id, dari id ke null, atau dari id ke id lain)
        if ($oldOrgUnitId != $newOrgUnitId) {
            Cache::forget('org_units_tree');
        }

        $user->load('orgUnit:id,name');

        return response()->json([
            'success' => true,
            'message' => 'User berhasil diperbarui.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'phone' => $user->phone,
                'employee_id' => $user->employee_id,
                'role' => $user->role,
                'org_unit_id' => $user->org_unit_id,
                'org_unit_name' => $user->orgUnit?->name,
                'title' => $user->title,
                'is_active' => $user->is_active,
            ],
        ]);
    }

    /**
     * Delete a user
     */
    public function destroy(User $user): JsonResponse
    {
        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun sendiri.',
            ], 403);
        }

        $user->delete();

        // Clear cache jika user memiliki org_unit_id
        if ($user->org_unit_id) {
            Cache::forget('org_units_tree');
        }

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dihapus.',
        ]);
    }

    /**
     * Download template Excel untuk import user
     */
    public function downloadTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set header
        $headers = ['NO', 'NAMA', 'EMAIL', 'USERNAME', 'TELEPON', 'EMPLOYEE_ID', 'JABATAN', 'PASSWORD'];
        $sheet->fromArray($headers, null, 'A1');

        // Style header
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4']
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ];
        $sheet->getStyle('A1:H1')->applyFromArray($headerStyle);

        // Set column widths
        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(30);
        $sheet->getColumnDimension('C')->setWidth(30);
        $sheet->getColumnDimension('D')->setWidth(20);
        $sheet->getColumnDimension('E')->setWidth(20);
        $sheet->getColumnDimension('F')->setWidth(20);
        $sheet->getColumnDimension('G')->setWidth(25);
        $sheet->getColumnDimension('H')->setWidth(20);

        // Add example row
        $exampleRow = [1, 'Contoh User', 'user@example.com', 'username', '+6281234567890', 'EMP001', 'Dekan', 'password123'];
        $sheet->fromArray($exampleRow, null, 'A2');

        // Style example row
        $exampleStyle = [
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'E7E6E6']
            ]
        ];
        $sheet->getStyle('A2:H2')->applyFromArray($exampleStyle);

        // Add note
        $sheet->setCellValue('A4', 'Catatan:');
        $sheet->setCellValue('A5', '- NAMA dan EMAIL wajib diisi');
        $sheet->setCellValue('A6', '- PASSWORD wajib diisi (minimal 8 karakter)');
        $sheet->setCellValue('A7', '- USERNAME, TELEPON, EMPLOYEE_ID, dan JABATAN opsional');
        $sheet->setCellValue('A8', '- Role akan otomatis menjadi "user" untuk semua data yang diimport');
        $sheet->getStyle('A4')->getFont()->setBold(true);

        $writer = new Xlsx($spreadsheet);
        $response = new StreamedResponse(function () use ($writer) {
            $writer->save('php://output');
        });

        $response->headers->set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $response->headers->set('Content-Disposition', 'attachment;filename="Template_Import_User.xlsx"');
        $response->headers->set('Cache-Control', 'max-age=0');

        return $response;
    }

    /**
     * Preview import data dari Excel file
     */
    public function previewImport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:10240'], // Max 10MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'File tidak valid. Pastikan file berformat .xlsx atau .xls dan ukuran maksimal 10MB.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            if (count($rows) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'File Excel kosong atau tidak memiliki data.',
                ], 422);
            }

            // Skip header row (row 1)
            $dataRows = array_slice($rows, 1);
            $previewData = [];
            $errors = [];

            // Get existing users for duplicate checking
            $existingEmails = User::pluck('email')->toArray();
            $existingUsernames = User::whereNotNull('username')->pluck('username')->toArray();
            $existingEmployeeIds = User::whereNotNull('employee_id')->pluck('employee_id')->toArray();

            foreach ($dataRows as $index => $row) {
                $rowNumber = $index + 2; // +2 because we start from row 2 (after header)
                $no = $row[0] ?? null;
                $nama = trim($row[1] ?? '');
                $email = trim($row[2] ?? '');
                $username = isset($row[3]) ? trim($row[3]) : null;
                $telepon = isset($row[4]) ? trim($row[4]) : null;
                $employeeId = isset($row[5]) ? trim($row[5]) : null;
                $jabatan = isset($row[6]) ? trim($row[6]) : null;
                $password = isset($row[7]) ? trim($row[7]) : '';

                // Skip completely empty rows - if all important fields are empty, skip the row
                if (empty($nama) && empty($email) && empty($password) && empty($username) && empty($telepon) && empty($employeeId) && empty($jabatan)) {
                    continue;
                }

                // Validate nama
                if (empty($nama)) {
                    $errors[] = [
                        'row' => $rowNumber,
                        'column' => 'NAMA',
                        'message' => 'Nama wajib diisi.',
                    ];
                }

                // Validate email
                if (empty($email)) {
                    $errors[] = [
                        'row' => $rowNumber,
                        'column' => 'EMAIL',
                        'message' => 'Email wajib diisi.',
                    ];
                } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $errors[] = [
                        'row' => $rowNumber,
                        'column' => 'EMAIL',
                        'message' => 'Email tidak valid.',
                    ];
                } elseif (in_array($email, $existingEmails)) {
                    $errors[] = [
                        'row' => $rowNumber,
                        'column' => 'EMAIL',
                        'message' => "Email \"{$email}\" sudah digunakan. Email harus unik.",
                    ];
                }

                // Check duplicate email in import data
                $duplicateEmailInImport = false;
                foreach ($previewData as $prevData) {
                    if ($prevData['email'] === $email && !empty($email)) {
                        $duplicateEmailInImport = true;
                        break;
                    }
                }
                if ($duplicateEmailInImport) {
                    $errors[] = [
                        'row' => $rowNumber,
                        'column' => 'EMAIL',
                        'message' => "Email \"{$email}\" duplikat dalam file Excel. Setiap email harus unik.",
                    ];
                }

                // Validate username (if provided)
                if (!empty($username)) {
                    if (in_array($username, $existingUsernames)) {
                        $errors[] = [
                            'row' => $rowNumber,
                            'column' => 'USERNAME',
                            'message' => "Username \"{$username}\" sudah digunakan. Username harus unik.",
                        ];
                    }

                    // Check duplicate username in import data
                    $duplicateUsernameInImport = false;
                    foreach ($previewData as $prevData) {
                        if ($prevData['username'] === $username && !empty($username)) {
                            $duplicateUsernameInImport = true;
                            break;
                        }
                    }
                    if ($duplicateUsernameInImport) {
                        $errors[] = [
                            'row' => $rowNumber,
                            'column' => 'USERNAME',
                            'message' => "Username \"{$username}\" duplikat dalam file Excel. Setiap username harus unik.",
                        ];
                    }
                }

                // Validate employee_id (if provided)
                if (!empty($employeeId)) {
                    if (in_array($employeeId, $existingEmployeeIds)) {
                        $errors[] = [
                            'row' => $rowNumber,
                            'column' => 'EMPLOYEE_ID',
                            'message' => "Employee ID \"{$employeeId}\" sudah digunakan. Employee ID harus unik.",
                        ];
                    }
                }

                // Validate phone (if provided)
                if (!empty($telepon)) {
                    // Basic phone validation - remove spaces, dashes, and check if it's numeric or starts with +
                    $cleanedPhone = preg_replace('/[\s\-]/', '', $telepon);
                    if (!preg_match('/^\+?[0-9]{8,15}$/', $cleanedPhone)) {
                        $errors[] = [
                            'row' => $rowNumber,
                            'column' => 'TELEPON',
                            'message' => 'Nomor telepon tidak valid. Format: +6281234567890 atau 081234567890.',
                        ];
                    }
                }

                // Validate password
                if (empty($password)) {
                    $errors[] = [
                        'row' => $rowNumber,
                        'column' => 'PASSWORD',
                        'message' => 'Password wajib diisi.',
                    ];
                } elseif (strlen($password) < 8) {
                    $errors[] = [
                        'row' => $rowNumber,
                        'column' => 'PASSWORD',
                        'message' => 'Password minimal 8 karakter.',
                    ];
                }

                $previewData[] = [
                    'no' => $no ? (int) $no : $rowNumber - 1,
                    'nama' => $nama,
                    'email' => $email,
                    'username' => $username ?: null,
                    'telepon' => $telepon ?: null,
                    'employee_id' => $employeeId ?: null,
                    'jabatan' => $jabatan ?: null,
                    'password' => $password,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $previewData,
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat membaca file Excel: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Import users dari Excel file
     */
    public function import(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:10240'], // Max 10MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'File tidak valid. Pastikan file berformat .xlsx atau .xls dan ukuran maksimal 10MB.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            if (count($rows) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'File Excel kosong atau tidak memiliki data.',
                ], 422);
            }

            // Skip header row (row 1)
            $dataRows = array_slice($rows, 1);
            $imported = 0;
            $failed = 0;
            $errors = [];

            // Get existing users for duplicate checking
            $existingEmails = User::pluck('email')->toArray();
            $existingUsernames = User::whereNotNull('username')->pluck('username')->toArray();
            $existingEmployeeIds = User::whereNotNull('employee_id')->pluck('employee_id')->toArray();

            foreach ($dataRows as $index => $row) {
                $rowNumber = $index + 2; // +2 because we start from row 2 (after header)
                $nama = trim($row[1] ?? '');
                $email = trim($row[2] ?? '');
                $username = isset($row[3]) ? trim($row[3]) : null;
                $telepon = isset($row[4]) ? trim($row[4]) : null;
                $employeeId = isset($row[5]) ? trim($row[5]) : null;
                $jabatan = isset($row[6]) ? trim($row[6]) : null;
                $password = isset($row[7]) ? trim($row[7]) : '';

                // Skip completely empty rows - if all important fields are empty, skip the row
                if (empty($nama) && empty($email) && empty($password) && empty($username) && empty($telepon) && empty($employeeId) && empty($jabatan)) {
                    continue;
                }

                // Skip if required fields are empty
                if (empty($nama) || empty($email) || empty($password)) {
                    $failed++;
                    continue;
                }

                // Validate email format
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $failed++;
                    continue;
                }

                // Check duplicates
                if (in_array($email, $existingEmails)) {
                    $failed++;
                    continue;
                }

                if (!empty($username) && in_array($username, $existingUsernames)) {
                    $failed++;
                    continue;
                }

                if (!empty($employeeId) && in_array($employeeId, $existingEmployeeIds)) {
                    $failed++;
                    continue;
                }

                // Validate password length
                if (strlen($password) < 8) {
                    $failed++;
                    continue;
                }

                try {
                    User::create([
                        'name' => $nama,
                        'email' => $email,
                        'username' => $username ?: null,
                        'phone' => $telepon ?: null,
                        'employee_id' => $employeeId ?: null,
                        'role' => User::ROLE_USER, // Auto set to user
                        'password' => Hash::make($password),
                        'title' => $jabatan ?: null,
                        'is_active' => true,
                    ]);

                    $imported++;
                    $existingEmails[] = $email; // Add to array to prevent duplicates in same import
                    if ($username) {
                        $existingUsernames[] = $username;
                    }
                    if ($employeeId) {
                        $existingEmployeeIds[] = $employeeId;
                    }
                } catch (\Exception $e) {
                    $failed++;
                }
            }

            // Clear cache
            Cache::forget('org_units_tree');

            return response()->json([
                'success' => true,
                'message' => "Import selesai. {$imported} user berhasil diimport, {$failed} gagal.",
                'data' => [
                    'imported' => $imported,
                    'failed' => $failed,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat import: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Check if email, username, or employee_id already exists
     */
    public function checkDuplicate(Request $request): JsonResponse
    {
        $request->validate([
            'field' => ['required', 'string', Rule::in(['email', 'username', 'employee_id'])],
            'value' => ['required', 'string'],
        ]);

        $field = $request->input('field');
        $value = $request->input('value');

        $exists = User::where($field, $value)->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'exists' => $exists,
            ],
        ]);
    }

}
