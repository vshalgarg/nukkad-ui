export const formatTabLabel = (label) => {
  return label
    .toLowerCase()           // "in_progress"
    .replace(/_/g, '-')      // "in-progress"
    .split('-')              // ["in", "progress"]
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // ["In", "Progress"]
    .join('-');              // "In-Progress"
};
