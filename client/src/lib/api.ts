import { CourseDataNew, CourseSeo } from "@/type";

export async function getCourse(slug: string): Promise<CourseDataNew> {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/course/get-course/${slug}`,
            {
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching course:", error);
        throw new Error("Failed to fetch course data");
    }
}

export async function fetchVideoUrl(chapterSlug: string): Promise<string> {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/chapter/url/${chapterSlug}`,
            {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (data && data.success && data.message) {
            return data.message;
        }
        throw new Error("Invalid video URL response");
    } catch (error) {
        console.error("Error fetching video URL:", error);
        throw new Error("Failed to fetch video URL");
    }
}

export async function checkPurchaseStatus(courseId: string): Promise<boolean> {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/purchase/${courseId}`,
            {
                method: "GET",
                cache: "no-store",
                next: { revalidate: 0 },
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        console.log(response);
        if (!response.ok) {
            return false;
        }
        const data = await response.json();
        if (data && data.success) {
            return data.message.purchased;
        }
        return false;
    } catch (error) {
        console.error("Error checking purchase status:", error);
        return false;
    }
}

export async function getSeoCourseData(): Promise<CourseSeo[]> {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/course/get-courses-for-seo`,
            {
                cache: "no-store",
                next: { revalidate: 0, tags: ["seo", "courses"] },
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching SEO course data:", error);
        return [];
    }
}
