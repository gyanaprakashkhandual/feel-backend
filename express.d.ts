declare namespace Express {
    interface User {
        _id: import("mongoose").Types.ObjectId;
        email: string;
        role: "individual" | "premium" | "therapist" | "hr_admin" | "researcher" | "super_admin";
        isActive: boolean;
    }

    interface Request {
        user?: User; // ✅ make it optional
    }
}