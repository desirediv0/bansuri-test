import type React from "react"

interface AvatarProps {
    src?: string
    alt?: string
    fallback?: string
    size?: "sm" | "md" | "lg"
}

const CustomAvatar: React.FC<AvatarProps> = ({ src, alt, fallback, size = "md" }) => {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
    }

    return (
        <div className={`relative rounded-full overflow-hidden ${sizeClasses[size]}`}>
            {src ? (
                <img src={src || "/placeholder.svg"} alt={alt} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600">
                    {fallback || alt?.charAt(0) || "?"}
                </div>
            )}
        </div>
    )
}

export default CustomAvatar

