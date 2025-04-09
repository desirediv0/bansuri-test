import React from "react";
import EditCourse from "../_components/EditCourse";

const EditPage = ({ params }: { params: { slug: string } }) => {
  return (
    <div>
      <EditCourse params={params} />
    </div>
  );
};

export default EditPage;
