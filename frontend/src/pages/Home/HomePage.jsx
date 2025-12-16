import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500
                    text-white p-8 rounded-2xl text-center text-2xl font-bold shadow-lg
                    hover:scale-105 transition-transform flex flex-col items-center gap-6">
      <div>Tailwind test</div>
      <div className="flex gap-4">
        <Link
          to='/signup'
          className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500
                     text-white px-6 py-3 rounded-full font-semibold shadow-lg
                     hover:scale-105 transition-transform"
        >
          Sign up
        </Link>
        <Link
          to='/login'
          className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500
                     text-white px-6 py-3 rounded-full font-semibold shadow-lg
                     hover:scale-105 transition-transform"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
