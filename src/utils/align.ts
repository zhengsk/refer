interface ElementPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

export class AlignHelper {
  /**
   * 获取元素的位置信息
   */
  private static getElementPosition(element: HTMLElement): ElementPosition {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  /**
   * 顶对齐
   */
  public static alignTop(elements: HTMLElement[]): void {
    if (elements.length < 2) return;

    const positions = elements.map(el => this.getElementPosition(el));
    const minTop = Math.min(...positions.map(p => p.top));

    elements.forEach((el, index) => {
      const currentTop = positions[index].top;
      const diff = minTop - currentTop;
      el.style.transform = `translateY(${diff}px)`;
    });
  }

  /**
   * 底对齐
   */
  public static alignBottom(elements: HTMLElement[]): void {
    if (elements.length < 2) return;

    const positions = elements.map(el => this.getElementPosition(el));
    const maxBottom = Math.max(...positions.map(p => p.top + p.height));

    elements.forEach((el, index) => {
      const currentBottom = positions[index].top + positions[index].height;
      const diff = maxBottom - currentBottom;
      el.style.transform = `translateY(${diff}px)`;
    });
  }

  /**
   * 水平居中对齐
   */
  public static alignCenter(elements: HTMLElement[]): void {
    if (elements.length < 2) return;

    const positions = elements.map(el => this.getElementPosition(el));
    const centerX = positions.reduce((sum, p) => sum + p.left + p.width / 2, 0) / positions.length;

    elements.forEach((el, index) => {
      const currentCenter = positions[index].left + positions[index].width / 2;
      const diff = centerX - currentCenter;
      el.style.transform = `translateX(${diff}px)`;
    });
  }

  /**
   * 左对齐
   */
  public static alignLeft(elements: HTMLElement[]): void {
    if (elements.length < 2) return;

    const positions = elements.map(el => this.getElementPosition(el));
    const minLeft = Math.min(...positions.map(p => p.left));

    elements.forEach((el, index) => {
      const currentLeft = positions[index].left;
      const diff = minLeft - currentLeft;
      el.style.transform = `translateX(${diff}px)`;
    });
  }

  /**
   * 右对齐
   */
  public static alignRight(elements: HTMLElement[]): void {
    if (elements.length < 2) return;

    const positions = elements.map(el => this.getElementPosition(el));
    const maxRight = Math.max(...positions.map(p => p.left + p.width));

    elements.forEach((el, index) => {
      const currentRight = positions[index].left + positions[index].width;
      const diff = maxRight - currentRight;
      el.style.transform = `translateX(${diff}px)`;
    });
  }

  /**
   * 垂直居中对齐
   */
  public static alignMiddle(elements: HTMLElement[]): void {
    if (elements.length < 2) return;

    const positions = elements.map(el => this.getElementPosition(el));
    const centerY = positions.reduce((sum, p) => sum + p.top + p.height / 2, 0) / positions.length;

    elements.forEach((el, index) => {
      const currentCenter = positions[index].top + positions[index].height / 2;
      const diff = centerY - currentCenter;
      el.style.transform = `translateY(${diff}px)`;
    });
  }

  /**
   * 水平平均分布
   */
  public static distributeHorizontally(elements: HTMLElement[]): void {
    if (elements.length < 3) return;

    const positions = elements.map(el => this.getElementPosition(el));
    const leftmost = Math.min(...positions.map(p => p.left));
    const rightmost = Math.max(...positions.map(p => p.left + p.width));
    const totalWidth = rightmost - leftmost;

    // 计算元素之间的间距
    const spacing = totalWidth / (positions.length - 1);

    // 按left值排序
    const sortedElements = elements.map((el, index) => ({
      element: el,
      position: positions[index]
    })).sort((a, b) => a.position.left - b.position.left);

    sortedElements.forEach((item, index) => {
      if (index === 0 || index === sortedElements.length - 1) return;

      const targetLeft = leftmost + spacing * index;
      const diff = targetLeft - item.position.left;
      item.element.style.transform = `translateX(${diff}px)`;
    });
  }

  /**
   * 垂直平均分布
   */
  public static distributeVertically(elements: HTMLElement[]): void {
    if (elements.length < 3) return;

    const positions = elements.map(el => this.getElementPosition(el));
    const topmost = Math.min(...positions.map(p => p.top));
    const bottommost = Math.max(...positions.map(p => p.top + p.height));
    const totalHeight = bottommost - topmost;

    // 计算元素之间的间距
    const spacing = totalHeight / (positions.length - 1);

    // 按top值排序
    const sortedElements = elements.map((el, index) => ({
      element: el,
      position: positions[index]
    })).sort((a, b) => a.position.top - b.position.top);

    sortedElements.forEach((item, index) => {
      if (index === 0 || index === sortedElements.length - 1) return;

      const targetTop = topmost + spacing * index;
      const diff = targetTop - item.position.top;
      item.element.style.transform = `translateY(${diff}px)`;
    });
  }
} 
