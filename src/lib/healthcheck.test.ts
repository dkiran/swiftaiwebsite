import { describe, it, expect } from 'vitest';
import { questions, scoreHealthCheck, recommendations } from './healthcheck';

const all = (pts: number) => Object.fromEntries(questions.map((q) => [q.id, pts]));

describe('scoreHealthCheck', () => {
  it('has 8 questions, each with a unique area and 3 options worth 0, 1 and 2', () => {
    expect(questions).toHaveLength(8);
    expect(new Set(questions.map((q) => q.area)).size).toBe(8);
    for (const q of questions) expect(q.options.map((o) => o.points)).toEqual([0, 1, 2]);
  });
  it('scores all-zero answers as 0 and foundation, listing three weakest areas', () => {
    const r = scoreHealthCheck(all(0));
    expect(r.complete).toBe(true);
    expect(r.score).toBe(0);
    expect(r.band).toBe('foundation');
    expect(r.weakest).toHaveLength(3);
  });
  it('scores all-max answers as 100 and strong with no weak areas', () => {
    const r = scoreHealthCheck(all(2));
    expect(r.score).toBe(100);
    expect(r.band).toBe('strong');
    expect(r.weakest).toEqual([]);
  });
  it('is growing for a middling score and lists only areas below the maximum', () => {
    const r = scoreHealthCheck(all(1));
    expect(r.score).toBe(50);
    expect(r.band).toBe('growing');
    expect(r.weakest.length).toBeGreaterThan(0);
  });
  it('reports incomplete when any question is unanswered', () => {
    const a = all(2); delete a[questions[0].id];
    expect(scoreHealthCheck(a).complete).toBe(false);
  });
  it('ignores out-of-range points by clamping to 0–2', () => {
    expect(scoreHealthCheck(all(9)).score).toBe(100);
    expect(scoreHealthCheck(all(-4)).score).toBe(0);
  });
  it('has a recommendation for every area', () => {
    for (const q of questions) expect(recommendations[q.area]).toBeTruthy();
  });
});
