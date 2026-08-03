import { SVGProps } from "react";

const LocationPinIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 256 256" fill="none" {...props}>
    <g transform="translate(1.41 1.41) scale(2.81 2.81)">
      <path
        d="M 45 90 c -0.558 0 -1.011 -0.452 -1.011 -1.011 V 41.062 c 0 -0.558 0.453 -1.011 1.011 -1.011 s 1.011 0.453 1.011 1.011 v 47.927 C 46.011 89.548 45.558 90 45 90 z"
        fill="rgb(102,103,107)"
      />
      <circle cx="45.001" cy="20.531" r="20.531" fill="rgb(242,63,56)" />
      <circle cx="52.076" cy="13.456" r="5.056" fill="rgb(255,158,154)" />
    </g>
  </svg>
);

export default LocationPinIcon;
