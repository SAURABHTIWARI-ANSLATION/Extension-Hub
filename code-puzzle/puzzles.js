const PUZZLES = {
  javascript: [
    // EASY
    {
      difficulty: "easy",
      question: "Reverse a string without using .reverse()",
      solution:
`function reverseString(str) {
  let result = "";
  for (let i = str.length - 1; i >= 0; i--) {
    result += str[i];
  }
  return result;
}

// Alternative with spread & reverse
// return [...str].reverse().join('');`
    },
    {
      difficulty: "easy",
      question: "Remove duplicates from an array",
      solution:
`// Using ES6 Set
function removeDuplicates(arr) {
  return [...new Set(arr)];
}

// Alternative: Using filter
function removeDuplicates(arr) {
  return arr.filter((item, index) => 
    arr.indexOf(item) === index
  );
}`
    },
    {
      difficulty: "easy",
      question: "Print FizzBuzz (1 to n)",
      solution:
`function fizzBuzz(n) {
  for (let i = 1; i <= n; i++) {
    let output = "";
    if (i % 3 === 0) output += "Fizz";
    if (i % 5 === 0) output += "Buzz";
    console.log(output || i);
  }
}`
    },
    {
      difficulty: "easy",
      question: "Capitalize the first letter of each word",
      solution:
`function titleCase(str) {
  return str.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() 
      + word.slice(1))
    .join(' ');
}

// Or using replace with regex
function titleCase(str) {
  return str.replace(/\b\w/g, char => 
    char.toUpperCase()
  );
}`
    },
    {
      difficulty: "easy",
      question: "Find the sum of all numbers in an array",
      solution:
`function sumArray(arr) {
  return arr.reduce((sum, num) => sum + num, 0);
}

// Alternative: Using loop
function sumArray(arr) {
  let sum = 0;
  for (let num of arr) sum += num;
  return sum;
}`
    },

    // MEDIUM
    {
      difficulty: "medium",
      question: "Find the first non-repeating character",
      solution:
`function firstUniqueChar(str) {
  const map = {};
  for (let char of str) {
    map[char] = (map[char] || 0) + 1;
  }
  for (let char of str) {
    if (map[char] === 1) return char;
  }
  return null;
}`
    },
    {
      difficulty: "medium",
      question: "Check if two strings are anagrams",
      solution:
`function isAnagram(str1, str2) {
  const format = s => s.toLowerCase()
    .replace(/[^a-z]/g, '')
    .split('').sort().join('');
  return format(str1) === format(str2);
}

// More efficient with char count
function isAnagram(str1, str2) {
  if (str1.length !== str2.length) return false;
  const count = {};
  for (let char of str1) {
    count[char] = (count[char] || 0) + 1;
  }
  for (let char of str2) {
    if (!count[char]) return false;
    count[char]--;
  }
  return true;
}`
    },
    {
      difficulty: "medium",
      question: "Calculate Factorial (Recursive)",
      solution:
`function factorial(n) {
  if (n < 0) return -1;
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

// Iterative approach
function factorial(n) {
  if (n < 0) return -1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}`
    },
    {
      difficulty: "medium",
      question: "Find the longest word in a string",
      solution:
`function findLongestWord(str) {
  const words = str.split(' ');
  return words.reduce((longest, current) => 
    current.length > longest.length ? current : longest
  );
}

// Alternative: Using sort
function findLongestWord(str) {
  return str.split(' ')
    .sort((a, b) => b.length - a.length)[0];
}`
    },
    {
      difficulty: "medium",
      question: "Chunk an array into groups of size n",
      solution:
`function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// Using reduce
function chunkArray(arr, size) {
  return arr.reduce((chunks, item, i) => {
    if (i % size === 0) chunks.push([]);
    chunks[chunks.length - 1].push(item);
    return chunks;
  }, []);
}`
    },

    // HARD
    {
      difficulty: "hard",
      question: "Implement debounce function",
      solution:
`function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Usage:
// const debouncedSearch = debounce(search, 300);
// input.addEventListener('input', debouncedSearch);`
    },
    {
      difficulty: "hard",
      question: "Deep clone an object",
      solution:
`function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (obj instanceof Object) {
    const cloned = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
}

// Modern alternative
function deepClone(obj) {
  return structuredClone(obj);
}`
    },
    {
      difficulty: "hard",
      question: "Implement Promise.all",
      solution:
`function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;
    
    if (promises.length === 0) {
      resolve(results);
      return;
    }
    
    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value => {
          results[index] = value;
          completed++;
          if (completed === promises.length) {
            resolve(results);
          }
        })
        .catch(reject);
    });
  });
}`
    },
    {
      difficulty: "hard",
      question: "Find all permutations of a string",
      solution:
`function getPermutations(str) {
  if (str.length <= 1) return [str];
  
  const permutations = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const remaining = str.slice(0, i) + str.slice(i + 1);
    const subPerms = getPermutations(remaining);
    
    for (let perm of subPerms) {
      permutations.push(char + perm);
    }
  }
  return permutations;
}

// Example: getPermutations('abc')
// Returns: ['abc','acb','bac','bca','cab','cba']`
    }
  ],

  python: [
    // EASY
    {
      difficulty: "easy",
      question: "Check if a number is a palindrome",
      solution:
`def is_palindrome(n):
    s = str(n)
    return s == s[::-1]

# Alternative without string slicing
def is_palindrome(n):
    s = str(n)
    return s == ''.join(reversed(s))`
    },
    {
      difficulty: "easy",
      question: "Count vowels in a string",
      solution:
`def count_vowels(s):
    vowels = "aeiouAEIOU"
    return sum(1 for char in s if char in vowels)

# Alternative using filter
def count_vowels(s):
    return len(list(filter(
        lambda c: c.lower() in 'aeiou', s
    )))`
    },
    {
      difficulty: "easy",
      question: "List of squares for even numbers",
      solution:
`def get_even_squares(nums):
    # List comprehension
    return [x**2 for x in nums if x % 2 == 0]

# Alternative: Using map and filter
def get_even_squares(nums):
    evens = filter(lambda x: x % 2 == 0, nums)
    return list(map(lambda x: x**2, evens))`
    },
    {
      difficulty: "easy",
      question: "Find the maximum number in a list",
      solution:
`def find_max(nums):
    if not nums:
        return None
    return max(nums)

# Without built-in max
def find_max(nums):
    if not nums:
        return None
    max_num = nums[0]
    for num in nums[1:]:
        if num > max_num:
            max_num = num
    return max_num`
    },
    {
      difficulty: "easy",
      question: "Reverse a list without using reverse()",
      solution:
`def reverse_list(lst):
    return lst[::-1]

# Alternative: Using loop
def reverse_list(lst):
    return [lst[i] for i in range(len(lst)-1, -1, -1)]

# In-place reversal
def reverse_list(lst):
    left, right = 0, len(lst) - 1
    while left < right:
        lst[left], lst[right] = lst[right], lst[left]
        left += 1
        right -= 1
    return lst`
    },

    // MEDIUM
    {
      difficulty: "medium",
      question: "Flatten a nested list",
      solution:
`def flatten(lst):
    result = []
    for item in lst:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result

# Using list comprehension
def flatten(lst):
    return [item for sublist in lst 
            for item in (flatten(sublist) 
            if isinstance(sublist, list) 
            else [sublist]))`
    },
    {
      difficulty: "medium",
      question: "Fibonacci Sequence (Recursive)",
      solution:
`def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Optimized with memoization
def fibonacci(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fibonacci(n-1, memo) + fibonacci(n-2, memo)
    return memo[n]`
    },
    {
      difficulty: "medium",
      question: "Check if a number is Prime",
      solution:
`def is_prime(n):
    if n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    for i in range(3, int(n**0.5) + 1, 2):
        if n % i == 0:
            return False
    return True`
    },
    {
      difficulty: "medium",
      question: "Merge two dictionaries",
      solution:
`def merge_dicts(d1, d2):
    # Python 3.9+ syntax
    return d1 | d2

# Python 3.5+ syntax
def merge_dicts(d1, d2):
    return {**d1, **d2}

# Older Python
def merge_dicts(d1, d2):
    result = d1.copy()
    result.update(d2)
    return result`
    },
    {
      difficulty: "medium",
      question: "Find the second largest number in a list",
      solution:
`def second_largest(nums):
    if len(nums) < 2:
        return None
    unique = list(set(nums))
    unique.sort()
    return unique[-2] if len(unique) >= 2 else None

# More efficient O(n)
def second_largest(nums):
    if len(nums) < 2:
        return None
    first = second = float('-inf')
    for num in nums:
        if num > first:
            second = first
            first = num
        elif num > second and num != first:
            second = num
    return second if second != float('-inf') else None`
    },

    // HARD
    {
      difficulty: "hard",
      question: "Implement a decorator to measure execution time",
      solution:
`import time
from functools import wraps

def timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end-start:.4f}s")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)
    return "Done"`
    },
    {
      difficulty: "hard",
      question: "Implement LRU Cache",
      solution:
`from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity
    
    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

# Usage: cache = LRUCache(2)`
    },
    {
      difficulty: "hard",
      question: "Find all subsets of a set (Power Set)",
      solution:
`def power_set(nums):
    result = [[]]
    for num in nums:
        result += [curr + [num] for curr in result]
    return result

# Using recursion
def power_set(nums):
    if not nums:
        return [[]]
    
    subsets = power_set(nums[1:])
    return subsets + [[nums[0]] + subset 
                      for subset in subsets]

# Example: power_set([1,2,3])
# Returns: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]`
    },
    {
      difficulty: "hard",
      question: "Implement a binary search function",
      solution:
`def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

# Recursive version
def binary_search(arr, target, left=0, right=None):
    if right is None:
        right = len(arr) - 1
    if left > right:
        return -1
    mid = (left + right) // 2
    if arr[mid] == target:
        return mid
    elif arr[mid] < target:
        return binary_search(arr, target, mid + 1, right)
    else:
        return binary_search(arr, target, left, mid - 1)`
    }
  ]
};