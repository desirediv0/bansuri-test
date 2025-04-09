export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    usertype: string;
    isVerified: boolean;
    purchases: {
        id: string;
        course: {
            id: string;
            title: string;
            price: number;
            salePrice: number | null;
        };
    }[];
    enrollments: {
        id: string;
        course: {
            id: string;
            title: string;
            paid: boolean;
        };
    }[];
}

export interface Course {
    id: string;
    title: string;
    price: number;
    salePrice: number | null;
    paid: boolean;
    language: string;
    category: {
        name: string;
    };
}

export interface DashboardResponse {
    users: User[];
    courses: Course[];
}