// src/components/Breadcrumb.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb as BSBreadcrumb } from 'react-bootstrap';

const BreadcrumbPers = ({ items }) => {
  return (
    <BSBreadcrumb>
      {items.map((item, index) => (
        <BSBreadcrumb.Item
          key={index}
          linkAs={Link}
          linkProps={{ to: item.path }}
          active={index === items.length - 1}
        >
          {item.label}
        </BSBreadcrumb.Item>
      ))}
    </BSBreadcrumb>
  );
};

export default BreadcrumbPers;
