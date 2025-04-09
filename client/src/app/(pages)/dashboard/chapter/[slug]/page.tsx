import { Metadata } from "next";
import CourseChapters from "../../_components/chapters/CourseChapters";

const formatSlugToTitle = (slug: string): string => {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const title = formatSlugToTitle(params.slug);

  return {
    title: `${title} - Course Management`,
    description: `Manage chapters for ${title}`,
  };
}

export default function CourseManagement({
  params,
}: {
  params: { slug: string };
}) {
  const SectionSlug = formatSlugToTitle(params.slug);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">{SectionSlug}</h1>
      <CourseChapters sectionSlug={params.slug} />
    </div>
  );
}
