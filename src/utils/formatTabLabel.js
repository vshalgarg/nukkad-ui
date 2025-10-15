export const formatTabLabel = label => {
  return label
    .toLowerCase() 
    .replace(/_/g, '-') 
    .split('-') 
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
