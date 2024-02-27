export function slugify(text: string): string {
  // Convert the text to lowercase
  text = text.toLowerCase();

  // Remove special characters and replace spaces with hyphens
  text = text
    .replace(/[^a-z0-9 -]/g, "") // Remove non-alphanumeric characters except for spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .trim(); // Trim whitespace from both ends

  return text;
}
