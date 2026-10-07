// One geometry model for animation, keyboard navigation and concept returns.
export function galleryGeometry(width: number, cardWidth: number, count = 5) {
 const stride = width <= 700 ? 1.02 : .52;
 const start = 1.12;
 const total = start + (count - 1) * stride + cardWidth / width + .22;
 return {stride, start, total, entrance: .16, duration: .78};
}

export function galleryCardProgress(width: number, cardWidth: number, index: number) {
 const {stride, start, total, entrance, duration} = galleryGeometry(width, cardWidth);
 const centre = (1 - cardWidth / width) * .5;
 return entrance + duration * (start + index * stride - centre) / total;
}
