<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create 1 Admin account (highest role)
        User::factory()->admin()->create([
            'name' => 'Admin',
            'username' => 'admin',
            'email' => 'admin@umj.ac.id',
            'phone' => '+62 812-3456-7889',
            'employee_id' => 'ADM001',
            'password' => Hash::make('admin123'),
        ]);

        // Create sample user accounts (all with role 'user')
        $userAccounts = [
            ['name' => 'Prof. Dr. Ahmad Dahlan, M.Med', 'username' => 'user.dekan', 'email' => 'user.dekan@umj.ac.id', 'phone' => '+62 812-3456-7890', 'employee_id' => 'USR001', 'password' => Hash::make('user123')],
            ['name' => 'Dr. Budi Santoso, M.Kes', 'username' => 'user.akademik', 'email' => 'user.akademik@umj.ac.id', 'phone' => '+62 812-3456-7891', 'employee_id' => 'USR002', 'password' => Hash::make('user123')],
            ['name' => 'Dr. Siti Aminah, M.Pd', 'username' => 'user.penelitian', 'email' => 'user.penelitian@umj.ac.id', 'phone' => '+62 812-3456-7892', 'employee_id' => 'USR003', 'password' => Hash::make('user123')],
            ['name' => 'Dr. Hendra Wijaya, M.M', 'username' => 'user.keuangan', 'email' => 'user.keuangan@umj.ac.id', 'phone' => '+62 812-3456-7893', 'employee_id' => 'USR004', 'password' => Hash::make('user123')],
            ['name' => 'Dr. Ratna Dewi, M.Kes', 'username' => 'user.sdm', 'email' => 'user.sdm@umj.ac.id', 'phone' => '+62 812-3456-7894', 'employee_id' => 'USR005', 'password' => Hash::make('user123')],
            ['name' => 'Dr. Andi Wijaya, M.Kom', 'username' => 'user.andi', 'email' => 'user.andi@umj.ac.id', 'phone' => '+62 812-3456-7895', 'employee_id' => 'USR006', 'password' => Hash::make('user123')],
            ['name' => 'Dr. Sari Indah, M.Si', 'username' => 'user.sari', 'email' => 'user.sari@umj.ac.id', 'phone' => '+62 812-3456-7896', 'employee_id' => 'USR007', 'password' => Hash::make('user123')],
            ['name' => 'Dr. Bambang Suryanto, M.Sc', 'username' => 'user.bambang', 'email' => 'user.bambang@umj.ac.id', 'phone' => '+62 812-3456-7897', 'employee_id' => 'USR008', 'password' => Hash::make('user123')],
        ];

        foreach ($userAccounts as $user) {
            User::factory()->user()->create([
                'name' => $user['name'],
                'username' => $user['username'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'employee_id' => $user['employee_id'],
                'password' => $user['password'],
            ]);
        }
    }
}
