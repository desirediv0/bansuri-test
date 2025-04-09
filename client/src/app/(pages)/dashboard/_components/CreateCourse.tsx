"use client";
import React from "react";
import CourseForm from "./CourseForm";

const CreateCourse: React.FC = () => {
  return <CourseForm isEditing={false} initialData={null} courseSlug={null} />;
};

export default CreateCourse;
