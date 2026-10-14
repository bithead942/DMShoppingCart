import React from 'react';
import './CategoryIcon.css';

function CategoryIcon({ category }) {
  const iconPath = `../../img/${category}.png`;
  
  return (
    <img
      src={iconPath}
      alt={category}
      className="category-icon"
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  );
}

export default CategoryIcon;
