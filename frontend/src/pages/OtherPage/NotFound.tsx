import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function NotFound() {
  return (
    <>
      <PageMeta
        title="404 - Halaman Tidak Ditemukan | ITS (Integrated Task System)"
        description="Halaman yang Anda cari tidak ditemukan di ITS (Integrated Task System)"
      />
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            404
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Page Not Found
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}