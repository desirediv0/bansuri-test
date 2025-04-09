import type React from "react"

interface ProgressProps {
    value: number
    max?: number
    className?: string
}

const CustomProgress: React.FC<ProgressProps> = ({ value, max = 100, className = "" }) => {
    const percentage = (value / max) * 100

    return (
        <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
            <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
    )
}

export default CustomProgress

