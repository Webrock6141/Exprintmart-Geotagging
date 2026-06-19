"use client"

import Link from "next/link"
import { 
  FaFacebookF, 
  FaInstagram, 
  FaLinkedinIn, 
  FaYoutube, 
  FaPinterestP, 
  FaPhoneAlt 
} from "react-icons/fa"
import { MdEmail } from "react-icons/md"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-[#063A39] text-white/90 border-t border-white/10">
      {/* Top Info Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 text-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <a 
            href="mailto:info@exprintmart.com" 
            className="flex items-center gap-2 hover:text-[#1ABC9C] transition-colors"
          >
            <MdEmail className="h-4 w-4 text-[#1ABC9C]" />
            info@exprintmart.com
          </a>
          <a 
            href="tel:+971569317076" 
            className="flex items-center gap-2 hover:text-[#1ABC9C] transition-colors"
          >
            <FaPhoneAlt className="h-3.5 w-3.5 text-[#1ABC9C]" />
            +971 56 931 7076
          </a>
        </div>

        {/* Social Icons matching your branding order */}
        <div className="flex items-center gap-5">
          <Link href="#" className="hover:text-[#1ABC9C] transition-colors" aria-label="Instagram">
            <FaInstagram className="h-4 w-4" />
          </Link>
          <Link href="#" className="hover:text-[#1ABC9C] transition-colors" aria-label="Pinterest">
            <FaPinterestP className="h-4 w-4" />
          </Link>
          <Link href="#" className="hover:text-[#1ABC9C] transition-colors" aria-label="LinkedIn">
            <FaLinkedinIn className="h-4 w-4" />
          </Link>
          <Link href="#" className="hover:text-[#1ABC9C] transition-colors" aria-label="YouTube">
            <FaYoutube className="h-4 w-4" />
          </Link>
          <Link href="#" className="hover:text-[#1ABC9C] transition-colors" aria-label="Facebook">
            <FaFacebookF className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
        <p>
          &copy; {currentYear} <strong>Exprintmart</strong>. All rights reserved.
        </p>
        <p className="flex items-center gap-1">
          Developed with ❤️ by{" "}
          <Link 
            href="https://exprintmart.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[#1ABC9C] hover:underline font-medium"
          >
            Exprintmart
          </Link>
        </p>
      </div>
    </footer>
  )
}