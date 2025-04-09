export const truncateDescription = (description: string) => {
  if (!description) return "";

  try {
    // First convert HTML to plain text
    const div = document.createElement("div");
    div.innerHTML = description;
    const plainText = div.textContent || div.innerText || "";

    // Then truncate
    const maxLength = 50;
    return plainText.length > maxLength
      ? `${plainText.substring(0, maxLength)}...`
      : plainText;
  } catch (error) {
    console.error("Error truncating description:", error);
    return description.substring(0, 50) + "...";
  }
};
