const { generateTAC } = require('../ast/tacGenerator');
const { compareTAC } = require('../ast/tacComparator');

describe('TAC comparator - deterministic equivalence', () => {
  test('Same logic, different syntax (sum of first n): for vs while', () => {
    const pyFor = `
    n = 5
    s = 0
    for i in range(n):
      s = s + i
    print(s)
    `;
    const pyWhile = `
    n = 5
    s = 0
    i = 0
    while (i < n):
      s = s + i
      i = i + 1
    print(s)
    `;
    const t1 = generateTAC(pyFor, 'python');
    const t2 = generateTAC(pyWhile, 'python');
    const cmp = compareTAC(t1.instructions, t2.instructions);
    expect(cmp.similarity).toBeGreaterThanOrEqual(0.45);
  });

  test('Different logic, same output (hardcoded vs computed) -> low similarity', () => {
    const computed = `
    a = 2
    b = 3
    c = a + b
    print(c)
    `;
    const hardcoded = `
    print(5)
    `;
    const t1 = generateTAC(computed, 'python');
    const t2 = generateTAC(hardcoded, 'python');
    const cmp = compareTAC(t1.instructions, t2.instructions);
    expect(cmp.similarity).toBeLessThan(0.5);
  });

  test('Built-in vs manual sort should not match', () => {
    const builtin = `
    arr = [3,1,2]
    arr = sorted(arr)
    print(arr[0])
    `;
    const manual = `
    arr = [3,1,2]
    i = 0
    while (i < 2):
      j = 0
      while (j < 2):
        if (arr[j] > arr[j+1]):
          tmp = arr[j]
          arr[j] = arr[j+1]
          arr[j+1] = tmp
        j = j + 1
      i = i + 1
    print(arr[0])
    `;
    const t1 = generateTAC(builtin, 'python');
    const t2 = generateTAC(manual, 'python');
    const cmp = compareTAC(t1.instructions, t2.instructions);
    expect(cmp.similarity).toBeLessThan(0.6);
  });

  test('C-like for(init;cond;inc) vs while equivalence (JS)', () => {
    const jsFor = `
    n = 5;
    s = 0;
    for (i = 0; i < n; i++) {
      s = s + i;
    }
    return s;
    `;
    const jsWhile = `
    n = 5;
    s = 0;
    i = 0;
    while (i < n) {
      s = s + i;
      i = i + 1;
    }
    return s;
    `;
    const t1 = generateTAC(jsFor, 'javascript');
    const t2 = generateTAC(jsWhile, 'javascript');
    const cmp = compareTAC(t1.instructions, t2.instructions);
    expect(cmp.similarity).toBeGreaterThanOrEqual(0.28);
  });

  test('Increment normalization (++/+=) improves for/while similarity', () => {
    const jsFor = `
    n = 5;
    sum = 0;
    for (i = 0; i < n; ++i) {
      sum += i;
    }
    return sum;
    `;
    const jsWhile = `
    n = 5;
    sum = 0;
    i = 0;
    while (i < n) {
      sum = sum + i;
      i = i + 1;
    }
    return sum;
    `;
    const t1 = generateTAC(jsFor, 'javascript');
    const t2 = generateTAC(jsWhile, 'javascript');
    const cmp = compareTAC(t1.instructions, t2.instructions);
    expect(cmp.similarity).toBeGreaterThanOrEqual(0.25);
  });

  test('Cross-language nested loops/ifs equivalence (even sum)', () => {
    const py = `
    nums = [1,2,3,4,5,6]
    s = 0
    i = 0
    while (i < len(nums)):
      if nums[i] % 2 == 0:
        s = s + nums[i]
      else:
        s = s + 0
      i = i + 1
    return s
    `;
    const js = `
    const nums = [1,2,3,4,5,6];
    let s = 0;
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] % 2 === 0) {
        s = s + nums[i];
      } else {
        s = s + 0;
      }
    }
    return s;
    `;
    const t1 = generateTAC(py, 'python');
    const t2 = generateTAC(js, 'javascript');
    const cmp = compareTAC(t1.instructions, t2.instructions);
    expect(cmp.similarity).toBeGreaterThanOrEqual(0.21);
  });

  test('Relational symmetry: i > n vs n < i yields high similarity', () => {
    const a = `
    i = 10
    n = 3
    while (i > n):
      i = i - 1
    return i
    `;
    const b = `
    i = 10;
    n = 3;
    while (n < i) {
      i = i - 1;
    }
    return i;
    `;
    const t1 = generateTAC(a, 'python');
    const t2 = generateTAC(b, 'javascript');
    const cmp = compareTAC(t1.instructions, t2.instructions);
    expect(cmp.similarity).toBeGreaterThanOrEqual(0.3);
  });

  test('Nested control flow mismatch should stay low', () => {
    const correct = `
    nums = [1,2,3,4]
    s = 0
    i = 0
    while (i < len(nums)):
      if nums[i] % 2 == 0:
        s = s + nums[i]
      i = i + 1
    return s
    `;
    const wrong = `
    const nums = [1,2,3,4];
    let s = 0;
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] % 2 !== 0) {
        s = s + nums[i];
        break;
      }
    }
    return s;
    `;
    const t1 = generateTAC(correct, 'python');
    const t2 = generateTAC(wrong, 'javascript');
    const cmp = compareTAC(t1.instructions, t2.instructions);
    expect(cmp.similarity).toBeLessThan(0.35);
  });
});
