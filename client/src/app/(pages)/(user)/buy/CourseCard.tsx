import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseData } from "@/type";
import { formatPrice } from "@/helper/FormatPrice";

interface CourseCardProps {
  course: CourseData;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const discount = course.salePrice
    ? Math.round(((course.price - course.salePrice) / course.price) * 100)
    : 0;

  const displayPrice = (course.salePrice ?? 0) > 0 ? course.salePrice! : course.price;
  const showOriginalPrice = (course.salePrice ?? 0) > 0 && (course.salePrice ?? 0) < course.price;

  const getImageUrl = (image: string | null | undefined) => {
    if (!image) return 'https://placehold.co/600x400?text=No+Image';
    if (image.startsWith('http')) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-white border border-red-100/50 rounded-lg">
      {/* Image Container with Overlay */}
      <div className="relative h-32 overflow-hidden">
        <Image
          src={getImageUrl(course.thumbnail)}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Discount Badge */}
        {discount > 0 && (
          <Badge className="absolute top-2 right-2 bg-red-600 text-white border-0 text-xs px-2">
            {discount}% OFF
          </Badge>
        )}
      </div>

      <CardContent className="p-3 space-y-2">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
          {course.title}
        </h3>

        {/* Price Section */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-red-600">
            {formatPrice(displayPrice)}
          </span>
          {showOriginalPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(course.price)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;