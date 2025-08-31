// =========================
// 1. Basic / Fundamentals
// =========================

// Q1. FizzBuzz
// Print numbers from 1 to n. For multiples of 3 print "Fizz", for 5 print "Buzz", and for both print "FizzBuzz".
// Example: fizzBuzz(5) → "1,2,Fizz,4,Buzz"
// Time: O(n) | Space: O(1)
function fizzBuzz(n) {
  // your code here
}

// Q2. Palindrome Check
// Check if a given string is a palindrome.
// Example: isPalindrome("racecar") → true
// Example: isPalindrome("hello") → false
// Time: O(n) | Space: O(1)
function isPalindrome(str) {
  // your code here
}

// Q3. Reverse a String
// Reverse a string without using .reverse().
// Example: reverseString("hello") → "olleh"
// Time: O(n) | Space: O(n)
function reverseString(str) {
  // your code here
}

// Q4. Find Maximum in Array
// Find the maximum number in an array without using Math.max().
// Example: findMax([1, 7, 3, 9, 2]) → 9
// Time: O(n) | Space: O(1)
function findMax(arr) {
  // your code here
}

// Q5. Anagram Check
// Check if two strings are anagrams of each other.
// Example: areAnagrams("listen", "silent") → true
// Example: areAnagrams("rat", "car") → false
// Time: O(n log n) if using sort | Space: O(n)
function areAnagrams(str1, str2) {
  // your code here
}

// Q6. Count Characters/Vowels
// Count the vowels in a given string.
// Example: countVowels("hello world") → 3
// Time: O(n) | Space: O(1)
function countVowels(str) {
  // your code here
}



// =========================
// 2. Intermediate
// =========================

// Q7. Two Sum
// Return indices of two numbers in an array that add up to a target.
// Example: twoSum([2,7,11,15], 9) → [0,1]
// Time: O(n) | Space: O(n)
function twoSum(nums, target) {
  // your code here
}

// Q8. Valid Parentheses
// Check if a string of brackets is valid.
// Example: isValidParentheses("()[]{}") → true
// Example: isValidParentheses("(]") → false
// Time: O(n) | Space: O(n)
function isValidParentheses(s) {
  // your code here
}

// Q9. Merge Intervals
// Merge overlapping intervals in a 2D array.
// Example: mergeIntervals([[1,3],[2,6],[8,10],[15,18]]) → [[1,6],[8,10],[15,18]]
// Time: O(n log n) (sorting) | Space: O(n)
function mergeIntervals(intervals) {
  // your code here
}

// Q10. Contains Duplicate
// Check if an array contains duplicate values.
// Example: containsDuplicate([1,2,3,1]) → true
// Example: containsDuplicate([1,2,3,4]) → false
// Time: O(n) | Space: O(n)
function containsDuplicate(nums) {
  // your code here
}

// Q11. Binary Search
// Search for a target value in a sorted array.
// Example: binarySearch([1,2,3,4,5], 3) → 2
// Example: binarySearch([1,2,3,4,5], 6) → -1
// Time: O(log n) | Space: O(1)
function binarySearch(arr, target) {
  // your code here
}

// Q12. Max Subarray (Kadane's Algorithm)
// Find the subarray with the largest sum.
// Example: maxSubArray([-2,1,-3,4,-1,2,1,-5,4]) → 6
// Time: O(n) | Space: O(1)
function maxSubArray(nums) {
  // your code here
}

// Q13. Group Anagrams
// Group words that are anagrams of each other.
// Example: groupAnagrams(["eat","tea","tan","ate","nat","bat"]) → [["eat","tea","ate"],["tan","nat"],["bat"]]
// Time: O(n * k log k) where k = word length | Space: O(n)
function groupAnagrams(strs) {
  // your code here
}



// =========================
// 3. Advanced
// =========================

// Q14. Debounce
// Implement a debounce function.
// Example: const fn = debounce(()=>console.log("Hi"), 1000);
// Time: O(1) per call | Space: O(1)
function debounce(fn, delay) {
  // your code here
}

// Q15. Throttle
// Implement a throttle function.
// Example: const fn = throttle(()=>console.log("Hi"), 1000);
// Time: O(1) per call | Space: O(1)
function throttle(fn, limit) {
  // your code here
}

// Q16. Deep Clone
// Perform a deep copy of an object without JSON.parse(JSON.stringify()).
// Example: deepClone({a:1, b:{c:2}}) → {a:1, b:{c:2}}
// Time: O(n) where n = number of keys | Space: O(n)
function deepClone(obj) {
  // your code here
}

// Q17. Binary Tree Max Depth
// Find maximum depth of a binary tree.
// Example: maxDepth(root) → 3 (for a tree with 3 levels)
// Time: O(n) | Space: O(h) where h = tree height
function maxDepth(root) {
  // your code here
}

// Q18. Promise Polyfill
// Implement a basic Promise class with then and catch.
// Example: new MyPromise((res, rej)=>res(42)).then(val=>console.log(val)); → 42
// Time: O(1) creation | Space: O(1)
class MyPromise {
  constructor(executor) {
    // your code here
  }
}



// =========================
// 4. MERN-Specific / JS Concepts
// =========================

// Q19. var vs let vs const
// Show a scenario where var, let, and const behave differently.
// Example: scopeTest(); → demonstrate hoisting & block scoping
// Time: O(1) | Space: O(1)
function scopeTest() {
  // your code here
}

// Q20. == vs ===
// Show difference between equality and strict equality in JS.
// Example: equalityTest(5, "5"); → "==" true, "===" false
// Time: O(1) | Space: O(1)
function equalityTest(a, b) {
  // your code here
}

// Q21. Closures
// Write a function that demonstrates closures (e.g., counter).
// Example: const counter = makeCounter(); counter(); → 1, counter(); → 2
// Time: O(1) per call | Space: O(1)
function makeCounter() {
  // your code here
}

// Q22. this Keyword
// Show how "this" behaves differently inside object methods and regular functions.
// Example: obj.showThis();
// Time: O(1) | Space: O(1)
const obj = {
  value: 10,
  showThis: function () {
    // your code here
  }
};

// Q23. Async/Await
// Fetch data using async/await (mocked).
// Example: await fetchData(); → "data fetched"
// Time: O(1) for mock | Space: O(1)
async function fetchData() {
  // your code here
}

// Q24. Event Loop
// Show order of execution using setTimeout, Promise, and sync logs.
// Example: eventLoopDemo();
// Time: O(1) | Space: O(1)
function eventLoopDemo() {
  // your code here
}

// Q25. Polyfill map
// Implement Array.prototype.map as a polyfill.
// Example: [1,2,3].myMap(x=>x*2) → [2,4,6]
// Time: O(n) | Space: O(n)
Array.prototype.myMap = function(callback) {
  // your code here
}

// Q26. Reference vs Value
// Show how objects are passed by reference in JS.
// Example: referenceTest();
// Time: O(1) | Space: O(1)
function referenceTest() {
  // your code here
}
