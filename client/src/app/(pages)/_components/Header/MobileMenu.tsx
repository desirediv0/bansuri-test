import { motion } from "framer-motion";
import Link from "next/link";
import { LogIn, LogOut, User } from "lucide-react";
import CustomButton from "../CustomButton";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useAuth } from "@/helper/AuthContext";

interface MenuItem {
  name: string;
  href: string;
}

interface MobileMenuProps {
  menuItems: MenuItem[];
  onClose: () => void;
  headerState: "transparent" | "visible" | "hidden";
  handleLogout: () => void;
}

const menuVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
};

export default function MobileMenu({
  menuItems,
  onClose,
  headerState,
  handleLogout
}: MobileMenuProps) {
  const { isAuthenticated } = useAuth();

  // Handle menu item click to ensure dropdown closes
  const handleMenuItemClick = () => {
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-6 border-b border-[#ba1c33]">
          <Link href="/" onClick={handleMenuItemClick}>
            <Image
              src="/logo.png"
              alt="logo"
              width={240}
              height={40}
              className="object-contain"
            />
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#ba1c33] flex items-center justify-center text-white hover:bg-[#ba1c33]/90 hover:scale-105 transition-all duration-300"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        <nav className="flex flex-col space-y-6 mt-8 px-6">
          {menuItems.map((item, i) => (
            <motion.div
              key={item.name}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={menuVariants}
            >
              <Link
                href={item.href}
                className="text-white/90 hover:text-[#ba1c33] hover:translate-x-2 text-2xl font-medium tracking-wide transition-all duration-300 block"
                onClick={handleMenuItemClick}
              >
                {item.name}
              </Link>
            </motion.div>
          ))}

          <motion.div
            custom={menuItems.length}
            initial="hidden"
            animate="visible"
            variants={menuVariants}
            className="space-y-4"
          >
            {isAuthenticated ? (
              <>
                <Link
                  href="/user-profile"
                  className="flex items-center space-x-2 text-white/90 hover:text-[#ba1c33] text-xl font-medium"
                  onClick={handleMenuItemClick}
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    handleMenuItemClick();
                  }}
                  className="flex items-center space-x-2 text-white/90 hover:text-[#ba1c33] text-xl font-medium w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <CustomButton
                primaryText="Login"
                secondaryText="Login"
                icon={<LogIn className="h-5 w-5" />}
                href="/auth"
                className="w-full shadow shadow-[#ba1c33]"
                variant="filled"
                bgColor="#ba1c33"
                textColor="white"
                hoverBgColor="#a6172c"
                hoverTextColor="white"
                onClick={handleMenuItemClick}
              />
            )}
          </motion.div>
        </nav>

        <div className="mt-auto pb-8 px-6">
          <div className="flex justify-center space-x-8 py-6">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, index) => (
              <Link
                key={index}
                href="#"
                className="text-[#fff] hover:text-[#ba1c33] hover:scale-110 transition-all duration-300"
              >
                <Icon size={24} />
              </Link>
            ))}
          </div>
          <p className="text-center text-[#fff] text-sm">
            © 2024 All rights reserved
          </p>
        </div>
      </div>
    </motion.div>
  );
}