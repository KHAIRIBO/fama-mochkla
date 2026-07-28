import { MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-8 px-6 text-center text-gray-400 text-sm bg-white">
      <div className="flex items-center justify-center gap-2 mb-2">
        <MapPin className="w-4 h-4 text-gray-400" />
        <span className="font-poppins font-black text-gray-500">
          fama-<span className="text-blue-600">mochkla</span>
        </span>
      </div>
      <p>
        Created by Khairi Bouzakher —{" "}
        <a
          href="https://khairibouzakher.studio"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-blue-600 underline underline-offset-2 transition-colors"
        >
          khairibouzakher.studio
        </a>
      </p>
    </footer>
  );
}
