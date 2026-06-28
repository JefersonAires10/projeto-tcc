import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ProgressBar from '../ProgressBar';

describe('ProgressBar', () => {
  it('renderiza barra com valor 50%', () => {
    const { container } = render(<ProgressBar value={50} />);
    const outerBar = container.firstChild;
    expect(outerBar).toBeTruthy();
    const innerBar = outerBar.firstChild;
    expect(innerBar.style.width).toBe('50%');
  });

  it('renderiza barra com valor 0%', () => {
    const { container } = render(<ProgressBar value={0} />);
    const innerBar = container.firstChild.firstChild;
    expect(innerBar.style.width).toBe('0%');
  });

  it('usa cor e altura customizadas', () => {
    const { container } = render(<ProgressBar value={75} color="var(--green)" height={10} />);
    const innerBar = container.firstChild.firstChild;
    expect(innerBar.style.background).toBe('var(--green)');
    expect(innerBar.style.width).toBe('75%');
  });
});
