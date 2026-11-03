/**
 * Excel Formulas & Functions Catalog & Smart Explainer Engine
 * 100% Client-side privacy.
 */

export const EXCEL_CATEGORIES = [
  { id: 'all', label: 'All Formulas', count: 64 },
  { id: 'lookup', label: 'Lookup & Reference', count: 11 },
  { id: 'logical', label: 'Logical & Conditions', count: 9 },
  { id: 'math', label: 'Math & Statistics', count: 16 },
  { id: 'text', label: 'Text & Strings', count: 14 },
  { id: 'date', label: 'Date & Time', count: 8 },
  { id: 'dynamic', label: 'Dynamic Arrays', count: 6 },
];

export const EXCEL_FORMULAS_DATABASE = [
  // ================= LOOKUP & REFERENCE =================
  {
    name: 'XLOOKUP',
    category: 'lookup',
    badge: 'Modern Essential',
    syntax: '=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])',
    description: 'Searches a range or array for a match and returns the corresponding item from a second range. Replaces VLOOKUP and HLOOKUP with faster, safer lookups that can look in any direction (left, right, up, down).',
    exampleFormula: '=XLOOKUP("E-104", A2:A10, C2:C10, "Not Found")',
    exampleExplanation: 'Looks up employee ID "E-104" in column A (A2:A10) and returns the corresponding Department from column C (C2:C10). If "E-104" is not found, it returns "Not Found" instead of an error.',
    sampleTable: {
      headers: ['Emp ID (A)', 'Name (B)', 'Department (C)', 'Salary (D)'],
      rows: [
        ['E-101', 'John Doe', 'Engineering', '$95,000'],
        ['E-102', 'Sarah Smith', 'Marketing', '$82,000'],
        ['E-103', 'Alex Ray', 'Product', '$91,000'],
        ['E-104', 'Emily Chen', 'Design', '$88,000'],
      ],
      resultRow: { formula: '=XLOOKUP("E-104", A2:A5, C2:C5, "Not Found")', result: 'Design', note: 'Matched E-104 in row 4, returned Department column' },
    },
    arguments: [
      { name: 'lookup_value', required: true, description: 'The value you want to search for (e.g. cell reference A2, number, or text).' },
      { name: 'lookup_array', required: true, description: 'The single row or column where Excel should search for the lookup_value.' },
      { name: 'return_array', required: true, description: 'The row or column containing the values you want to retrieve.' },
      { name: 'if_not_found', required: false, description: 'Text or value to return if no valid match is found (avoids #N/A errors).' },
      { name: 'match_mode', required: false, description: '0 for exact match (default), -1 for exact or next smaller, 1 for exact or next larger, 2 for wildcard.' },
      { name: 'search_mode', required: false, description: '1 to search first-to-last (default), -1 for last-to-first, 2 for binary search.' },
    ],
    tips: [
      'XLOOKUP defaults to an exact match, unlike VLOOKUP which defaults to approximate matching.',
      'Unlike VLOOKUP, XLOOKUP can return values located to the left of the lookup column.',
      'If columns are inserted or deleted in your table, XLOOKUP formulas will not break.',
    ],
  },
  {
    name: 'VLOOKUP',
    category: 'lookup',
    badge: 'Classic Staple',
    syntax: '=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])',
    description: 'Searches for a value in the first column of a table range and returns a value in the same row from a specified column to the right.',
    exampleFormula: '=VLOOKUP(A2, $D$2:$G$50, 3, FALSE)',
    exampleExplanation: 'Finds the value in cell A2 within column D (the first column of $D$2:$G$50) and returns the corresponding value from the 3rd column (column F). FALSE ensures an exact match.',
    sampleTable: {
      headers: ['Product Code (D)', 'Product Name (E)', 'Category (F)', 'Unit Price (G)'],
      rows: [
        ['P-100', 'Wireless Mouse', 'Accessories', '$29.99'],
        ['P-200', 'Mechanical Keyboard', 'Hardware', '$89.99'],
        ['P-300', '4K USB-C Monitor', 'Displays', '$349.99'],
      ],
      resultRow: { formula: '=VLOOKUP("P-200", D2:G4, 3, FALSE)', result: 'Hardware', note: 'Column index 3 corresponds to Category' },
    },
    arguments: [
      { name: 'lookup_value', required: true, description: 'The value to look for in the first column of the table range.' },
      { name: 'table_array', required: true, description: 'The table range containing data. Lookup column must always be the first column.' },
      { name: 'col_index_num', required: true, description: 'The column number in table_array from which to return the matching value (starts at 1).' },
      { name: 'range_lookup', required: false, description: 'FALSE (or 0) for exact match; TRUE (or 1) for approximate match. Always use FALSE unless matching sorted brackets.' },
    ],
    tips: [
      'Always lock your table range with dollar signs (e.g. $A$2:$D$100) so dragging down won’t shift the search area.',
      'Always set the 4th argument to FALSE (or 0) to avoid false matches.',
      'If you have Excel 365 or Excel 2021+, consider upgrading to XLOOKUP for greater resilience.',
    ],
  },
  {
    name: 'INDEX',
    category: 'lookup',
    badge: 'Power Lookup',
    syntax: '=INDEX(array, row_num, [column_num])',
    description: 'Returns the value of an element in a table or array selected by row and column position numbers. Commonly paired with MATCH.',
    exampleFormula: '=INDEX(C2:C50, 4)',
    exampleExplanation: 'Returns the value situated at row 4 within range C2:C50.',
    sampleTable: {
      headers: ['Item (A)', 'Region (B)', 'Sales (C)'],
      rows: [
        ['Laptops', 'North', '$12,400'],
        ['Desktops', 'South', '$8,900'],
        ['Monitors', 'East', '$5,600'],
        ['Tablets', 'West', '$7,800'],
      ],
      resultRow: { formula: '=INDEX(C2:C5, 4)', result: '$7,800', note: 'Retrieves item at 4th position of Sales column' },
    },
    arguments: [
      { name: 'array', required: true, description: 'A range of cells or an array constant from which to extract a value.' },
      { name: 'row_num', required: true, description: 'The row number in the array from which to return a value.' },
      { name: 'column_num', required: false, description: 'The column number in the array (optional if array is a single column).' },
    ],
    tips: [
      'INDEX does not slow down large workbooks because it only accesses memory at exact coordinates.',
      'Pairing INDEX with MATCH creates a flexible two-way lookup system.',
    ],
  },
  {
    name: 'MATCH',
    category: 'lookup',
    badge: 'Coordinate Finder',
    syntax: '=MATCH(lookup_value, lookup_array, [match_type])',
    description: 'Searches for a specified item in a range of cells and returns the relative position of that item (not the item itself).',
    exampleFormula: '=MATCH("Monitors", A2:A50, 0)',
    exampleExplanation: 'Searches for "Monitors" in column A (A2:A50) and returns its row number (e.g., 3). 0 specifies exact match.',
    sampleTable: {
      headers: ['Products (A)', 'Inventory (B)'],
      rows: [
        ['Laptops', '45'],
        ['Desktops', '20'],
        ['Monitors', '85'],
        ['Tablets', '32'],
      ],
      resultRow: { formula: '=MATCH("Monitors", A2:A5, 0)', result: '3', note: 'Position 3 in the selected range' },
    },
    arguments: [
      { name: 'lookup_value', required: true, description: 'The value you want to match in lookup_array.' },
      { name: 'lookup_array', required: true, description: 'A single row or single column range being searched.' },
      { name: 'match_type', required: false, description: '0 for exact match, 1 for less than (sorted ascending), -1 for greater than (sorted descending).' },
    ],
    tips: [
      'Combine with INDEX: =INDEX(return_range, MATCH(lookup_val, lookup_range, 0)).',
      'XMATCH is the modern counterpart that defaults to exact matching without needing a 0.',
    ],
  },
  {
    name: 'OFFSET',
    category: 'lookup',
    badge: 'Dynamic Reference',
    syntax: '=OFFSET(reference, rows, cols, [height], [width])',
    description: 'Returns a cell or range of cells that is a specified number of rows and columns away from an initial reference cell.',
    exampleFormula: '=OFFSET(A1, 3, 2)',
    exampleExplanation: 'Starting at cell A1, moves 3 rows down and 2 columns right (to cell C4) and returns its value.',
    sampleTable: {
      headers: ['A', 'B', 'C'],
      rows: [
        ['Start', '10', '20'],
        ['30', '40', '50'],
        ['60', '70', '80'],
        ['90', '100', 'Goal: 110'],
      ],
      resultRow: { formula: '=OFFSET(A1, 3, 2)', result: 'Goal: 110', note: 'Down 3 rows, right 2 columns' },
    },
    arguments: [
      { name: 'reference', required: true, description: 'The starting cell reference from which the offset is based.' },
      { name: 'rows', required: true, description: 'Number of rows up (negative) or down (positive) from the reference.' },
      { name: 'cols', required: true, description: 'Number of columns left (negative) or right (positive) from the reference.' },
      { name: 'height', required: false, description: 'The height in number of rows of the returned range.' },
      { name: 'width', required: false, description: 'The width in number of columns of the returned range.' },
    ],
    tips: [
      'OFFSET is a volatile function; Excel recalculates it on every workbook change, which can slow down massive workbooks.',
    ],
  },
  {
    name: 'INDIRECT',
    category: 'lookup',
    badge: 'Dynamic Reference',
    syntax: '=INDIRECT(ref_text, [a1])',
    description: 'Returns the reference specified by a text string. Allows creating dynamic formulas where sheet names or cell references change based on cell inputs.',
    exampleFormula: '=INDIRECT("Sheet" & A1 & "!B5")',
    exampleExplanation: 'If cell A1 contains the number 2, this formula evaluates to =Sheet2!B5 and returns the value from cell B5 on Sheet2.',
    sampleTable: {
      headers: ['Sheet Number (A1)', 'Formula Target', 'Result'],
      rows: [
        ['2', '="Sheet" & A1 & "!B5"', 'Value from Sheet2!B5'],
      ],
      resultRow: { formula: '=INDIRECT("Sheet2!B5")', result: '$4,500', note: 'Reads cell B5 from Sheet2' },
    },
    arguments: [
      { name: 'ref_text', required: true, description: 'A cell reference formatted as a text string (e.g. "A1", "Sheet2!B5", or a formula generating text).' },
      { name: 'a1', required: false, description: 'TRUE for A1 style reference (default), FALSE for R1C1 style.' },
    ],
    tips: [
      'Essential for dynamic dropdowns and summary sheets pulling from monthly tabs.',
    ],
  },

  // ================= LOGICAL & CONDITIONAL =================
  {
    name: 'IF',
    category: 'logical',
    badge: 'Decision Core',
    syntax: '=IF(logical_test, value_if_true, [value_if_false])',
    description: 'Checks whether a condition is met, returning one specified value if TRUE, and another value if FALSE.',
    exampleFormula: '=IF(B2>=75, "Pass", "Retake")',
    exampleExplanation: 'Checks if test score in cell B2 is greater than or equal to 75. Returns "Pass" if true, otherwise returns "Retake".',
    sampleTable: {
      headers: ['Student (A)', 'Score (B)', 'Result (C)'],
      rows: [
        ['Michael', '88', 'Pass'],
        ['Emma', '64', 'Retake'],
        ['Lucas', '92', 'Pass'],
      ],
      resultRow: { formula: '=IF(B2>=75, "Pass", "Retake")', result: 'Pass', note: '88 is greater than 75' },
    },
    arguments: [
      { name: 'logical_test', required: true, description: 'Any expression that evaluates to TRUE or FALSE (e.g., A1>50, B2="Approved").' },
      { name: 'value_if_true', required: true, description: 'The value or formula to calculate if logical_test is TRUE.' },
      { name: 'value_if_false', required: false, description: 'The value or formula to calculate if logical_test is FALSE (defaults to FALSE if omitted).' },
    ],
    tips: [
      'You can nest IF statements up to 64 levels, but using IFS or SWITCH is much cleaner for 3+ conditions.',
    ],
  },
  {
    name: 'IFS',
    category: 'logical',
    badge: 'Multi-Condition',
    syntax: '=IFS(logical_test1, value_if_true1, [logical_test2, value_if_true2], ...)',
    description: 'Evaluates multiple conditions in sequential order and returns the value corresponding to the first TRUE condition without nesting IF formulas.',
    exampleFormula: '=IFS(A2>=90, "A", A2>=80, "B", A2>=70, "C", TRUE, "F")',
    exampleExplanation: 'Tests grades from 90 down to 70. "TRUE, "F"" acts as the final else condition if none of the above are met.',
    sampleTable: {
      headers: ['Score (A)', 'Grade'],
      rows: [
        ['94', 'A'],
        ['83', 'B'],
        ['72', 'C'],
        ['58', 'F'],
      ],
      resultRow: { formula: '=IFS(A2>=90, "A", A2>=80, "B", TRUE, "F")', result: 'A', note: 'Matched first condition (94 >= 90)' },
    },
    arguments: [
      { name: 'logical_test1', required: true, description: 'First condition to test.' },
      { name: 'value_if_true1', required: true, description: 'Result if first condition is TRUE.' },
      { name: 'logical_test2...', required: false, description: 'Subsequent condition pairs.' },
    ],
    tips: [
      'Always add `TRUE, "Default Value"` as your last condition pair to handle fallback cases.',
    ],
  },
  {
    name: 'IFERROR',
    category: 'logical',
    badge: 'Error Shield',
    syntax: '=IFERROR(value, value_if_error)',
    description: 'Catches formula errors (#N/A, #VALUE!, #REF!, #DIV/0!, #NUM!, #NAME?, #NULL!) and returns a clean custom result instead of an ugly error code.',
    exampleFormula: '=IFERROR(A2/B2, 0)',
    exampleExplanation: 'Divides A2 by B2. If B2 is 0 or blank (causing a #DIV/0! error), the formula gracefully returns 0 instead.',
    sampleTable: {
      headers: ['Revenue (A)', 'Units (B)', 'Avg Price (C)'],
      rows: [
        ['$1,000', '10', '$100'],
        ['$500', '0', '$0 (Safeguarded)'],
      ],
      resultRow: { formula: '=IFERROR(A3/B3, 0)', result: '0', note: 'Handled division by zero cleanly' },
    },
    arguments: [
      { name: 'value', required: true, description: 'The formula, expression, or cell reference being checked for an error.' },
      { name: 'value_if_error', required: true, description: 'The value to return if the formula evaluates to an error (e.g. 0, "", "Not Found").' },
    ],
    tips: [
      'Wrap your VLOOKUP formulas in IFERROR: =IFERROR(VLOOKUP(...), "Item Not Found").',
    ],
  },
  {
    name: 'AND',
    category: 'logical',
    badge: 'Boolean Logic',
    syntax: '=AND(logical1, [logical2], ...)',
    description: 'Returns TRUE if all its arguments evaluate to TRUE; returns FALSE if one or more arguments evaluate to FALSE.',
    exampleFormula: '=IF(AND(A2>=18, B2="Citizen"), "Eligible", "Ineligible")',
    exampleExplanation: 'Returns "Eligible" only if age (A2) is 18 or older AND citizenship (B2) equals "Citizen".',
    sampleTable: {
      headers: ['Age (A)', 'Status (B)', 'Eligible?'],
      rows: [
        ['22', 'Citizen', 'Eligible'],
        ['17', 'Citizen', 'Ineligible'],
        ['30', 'Non-Citizen', 'Ineligible'],
      ],
      resultRow: { formula: '=AND(A2>=18, B2="Citizen")', result: 'TRUE', note: 'Both conditions satisfied' },
    },
    arguments: [
      { name: 'logical1', required: true, description: 'The first condition that can evaluate to TRUE or FALSE.' },
      { name: 'logical2...', required: false, description: 'Additional conditions (up to 255).' },
    ],
    tips: [
      'AND does not return values directly; pair it inside an IF function to return custom messages.',
    ],
  },
  {
    name: 'OR',
    category: 'logical',
    badge: 'Boolean Logic',
    syntax: '=OR(logical1, [logical2], ...)',
    description: 'Returns TRUE if any argument evaluates to TRUE; returns FALSE only if all arguments evaluate to FALSE.',
    exampleFormula: '=IF(OR(A2="Manager", B2>5), "Bonus", "Standard")',
    exampleExplanation: 'Awards a bonus if the employee is either a Manager OR has more than 5 years of tenure.',
    sampleTable: {
      headers: ['Role (A)', 'Tenure Years (B)', 'Status'],
      rows: [
        ['Engineer', '6', 'Bonus'],
        ['Manager', '2', 'Bonus'],
        ['Intern', '1', 'Standard'],
      ],
      resultRow: { formula: '=OR(A2="Manager", B2>5)', result: 'TRUE', note: 'Tenure condition satisfied' },
    },
    arguments: [
      { name: 'logical1', required: true, description: 'The first condition to test.' },
      { name: 'logical2...', required: false, description: 'Additional conditions.' },
    ],
    tips: [
      'Combine AND and OR inside an IF statement for complex business rule testing.',
    ],
  },

  // ================= MATH & STATISTICS =================
  {
    name: 'SUMIFS',
    category: 'math',
    badge: 'Multi-Condition Math',
    syntax: '=SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
    description: 'Adds all numbers in a range that meet multiple criteria across multiple columns.',
    exampleFormula: '=SUMIFS(D2:D100, A2:A100, "North", C2:C100, ">1000")',
    exampleExplanation: 'Sums sales revenue from column D only for orders in the "North" region (column A) where order value exceeded 1000 (column C).',
    sampleTable: {
      headers: ['Region (A)', 'Quarter (B)', 'Category (C)', 'Sales (D)'],
      rows: [
        ['North', 'Q1', 'Hardware', '$4,500'],
        ['South', 'Q1', 'Software', '$3,200'],
        ['North', 'Q2', 'Hardware', '$6,100'],
        ['North', 'Q2', 'Services', '$1,800'],
      ],
      resultRow: { formula: '=SUMIFS(D2:D5, A2:A5, "North", C2:C5, "Hardware")', result: '$10,600', note: 'Sums rows 1 and 3 ($4,500 + $6,100)' },
    },
    arguments: [
      { name: 'sum_range', required: true, description: 'The range of cells to sum (must be numbers).' },
      { name: 'criteria_range1', required: true, description: 'The range evaluated against criteria1.' },
      { name: 'criteria1', required: true, description: 'The condition in form of a number, expression, or text (e.g., "North", ">50", A1).' },
      { name: 'criteria_range2...', required: false, description: 'Additional ranges and matching criteria pairs.' },
    ],
    tips: [
      'In SUMIFS, sum_range comes FIRST. In the single-condition SUMIF, sum_range comes LAST. Always prefer SUMIFS for consistency.',
    ],
  },
  {
    name: 'COUNTIFS',
    category: 'math',
    badge: 'Multi-Condition Counter',
    syntax: '=COUNTIFS(criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
    description: 'Counts the number of rows or cells across multiple ranges that meet multiple conditions simultaneously.',
    exampleFormula: '=COUNTIFS(A2:A50, "Completed", B2:B50, ">=" & TODAY())',
    exampleExplanation: 'Counts tasks that have status "Completed" in column A and a date on or after today in column B.',
    sampleTable: {
      headers: ['Status (A)', 'Department (B)'],
      rows: [
        ['Completed', 'IT'],
        ['In Progress', 'IT'],
        ['Completed', 'Sales'],
        ['Completed', 'IT'],
      ],
      resultRow: { formula: '=COUNTIFS(A2:A5, "Completed", B2:B5, "IT")', result: '2', note: 'Rows 1 and 4 match both criteria' },
    },
    arguments: [
      { name: 'criteria_range1', required: true, description: 'The first range to evaluate against criteria1.' },
      { name: 'criteria1', required: true, description: 'The condition to check in criteria_range1.' },
    ],
    tips: [
      'When referencing cell values with comparisons, concatenate with &: ">=" & C1.',
    ],
  },
  {
    name: 'AVERAGEIFS',
    category: 'math',
    badge: 'Conditional Average',
    syntax: '=AVERAGEIFS(average_range, criteria_range1, criteria1, ...)',
    description: 'Calculates the arithmetic average of all numbers in a range that meet one or more conditions.',
    exampleFormula: '=AVERAGEIFS(C2:C100, A2:A100, "Engineering", B2:B100, "Senior")',
    exampleExplanation: 'Averages salaries in column C for employees who are in "Engineering" (column A) AND hold the title "Senior" (column B).',
    sampleTable: {
      headers: ['Dept (A)', 'Level (B)', 'Salary (C)'],
      rows: [
        ['Engineering', 'Senior', '$120,000'],
        ['Engineering', 'Junior', '$75,000'],
        ['Engineering', 'Senior', '$130,000'],
        ['Marketing', 'Senior', '$110,000'],
      ],
      resultRow: { formula: '=AVERAGEIFS(C2:C5, A2:A5, "Engineering", B2:B5, "Senior")', result: '$125,000', note: 'Average of $120,000 and $130,000' },
    },
    arguments: [
      { name: 'average_range', required: true, description: 'The numerical range to average.' },
      { name: 'criteria_range1', required: true, description: 'Range to test against criteria1.' },
      { name: 'criteria1', required: true, description: 'The criteria to match.' },
    ],
    tips: [
      'Cells with text or blank cells in average_range are ignored automatically.',
    ],
  },
  {
    name: 'ROUND',
    category: 'math',
    badge: 'Precision Control',
    syntax: '=ROUND(number, num_digits)',
    description: 'Rounds a number to a specified number of decimal digits according to standard mathematical rounding rules.',
    exampleFormula: '=ROUND(A2, 2)',
    exampleExplanation: 'Rounds the value in cell A2 to 2 decimal places (e.g. 14.567 becomes 14.57).',
    sampleTable: {
      headers: ['Input Number (A)', 'num_digits', 'Result'],
      rows: [
        ['14.567', '2', '14.57'],
        ['99.234', '1', '99.2'],
        ['1420.75', '-2', '1,400 (Nearest hundred)'],
      ],
      resultRow: { formula: '=ROUND(14.567, 2)', result: '14.57', note: 'Rounds 7 up to 70' },
    },
    arguments: [
      { name: 'number', required: true, description: 'The number you want to round.' },
      { name: 'num_digits', required: true, description: 'Number of decimal places. 0 rounds to nearest integer, negative rounds to tens, hundreds, etc.' },
    ],
    tips: [
      'Use ROUNDUP to always round away from zero, or ROUNDDOWN to always round toward zero.',
    ],
  },

  // ================= TEXT & STRING FUNCTIONS =================
  {
    name: 'TEXTSPLIT',
    category: 'text',
    badge: 'Modern Text Power',
    syntax: '=TEXTSPLIT(text, col_delimiter, [row_delimiter], [ignore_empty], [match_mode], [pad_with])',
    description: 'Splits text strings into an array of rows or columns using specified delimiters (e.g., commas, spaces, dashes). Modern alternative to "Text to Columns".',
    exampleFormula: '=TEXTSPLIT(A2, ", ")',
    exampleExplanation: 'Splits a comma-separated list like "Apple, Banana, Orange" into separate columns.',
    sampleTable: {
      headers: ['Full Text (A)', 'Split Col 1', 'Split Col 2', 'Split Col 3'],
      rows: [
        ['John, Smith, NY', 'John', 'Smith', 'NY'],
      ],
      resultRow: { formula: '=TEXTSPLIT("John, Smith, NY", ", ")', result: 'John | Smith | NY', note: 'Spills automatically across 3 cells' },
    },
    arguments: [
      { name: 'text', required: true, description: 'The text string you want to split.' },
      { name: 'col_delimiter', required: true, description: 'The character or text string that marks where to split into columns.' },
      { name: 'row_delimiter', required: false, description: 'Delimiter to split text into rows.' },
    ],
    tips: [
      'Works as a dynamic array: the split results spill automatically into adjacent cells.',
    ],
  },
  {
    name: 'TEXTJOIN',
    category: 'text',
    badge: 'Delimiter Concatenation',
    syntax: '=TEXTJOIN(delimiter, ignore_empty, text1, [text2], ...)',
    description: 'Combines text from multiple ranges or strings into one string, inserting a specified delimiter between each item. Easily skips blank cells.',
    exampleFormula: '=TEXTJOIN(", ", TRUE, A2:A10)',
    exampleExplanation: 'Joins all non-empty names in range A2:A10 separated by commas and spaces.',
    sampleTable: {
      headers: ['Item 1', 'Item 2', 'Item 3', 'Result'],
      rows: [
        ['Red', '(blank)', 'Blue', 'Red, Blue'],
      ],
      resultRow: { formula: '=TEXTJOIN(", ", TRUE, A2:C2)', result: 'Red, Blue', note: 'Skipped the blank cell cleanly' },
    },
    arguments: [
      { name: 'delimiter', required: true, description: 'A character or text string inserted between combined text items.' },
      { name: 'ignore_empty', required: true, description: 'TRUE to skip blank cells, FALSE to include empty delimiters.' },
      { name: 'text1', required: true, description: 'Text string or range of cells to combine.' },
    ],
    tips: [
      'Much more convenient than CONCATENATE because it accepts whole ranges like A1:A20.',
    ],
  },
  {
    name: 'TRIM',
    category: 'text',
    badge: 'Data Cleaning',
    syntax: '=TRIM(text)',
    description: 'Removes all leading, trailing, and repeated spaces from text, leaving only single spaces between words. Essential for cleaning VLOOKUP key mismatches.',
    exampleFormula: '=TRIM(A2)',
    exampleExplanation: 'Cleans up dirty text like "   Apple   Inc.  " into "Apple Inc.".',
    sampleTable: {
      headers: ['Raw String (A)', 'Trimmed Result'],
      rows: [
        ['"  Item A100  "', 'Item A100'],
      ],
      resultRow: { formula: '=TRIM("  Product  Name  ")', result: 'Product Name', note: 'Removed outer and duplicate inner spaces' },
    },
    arguments: [
      { name: 'text', required: true, description: 'The text from which you want spaces removed.' },
    ],
    tips: [
      'Unseen trailing spaces in cells are the #1 cause of VLOOKUP and XLOOKUP returning #N/A.',
    ],
  },
  {
    name: 'SUBSTITUTE',
    category: 'text',
    badge: 'Find & Replace',
    syntax: '=SUBSTITUTE(text, old_text, new_text, [instance_num])',
    description: 'Substitutes new_text for old_text in a text string. Case-sensitive.',
    exampleFormula: '=SUBSTITUTE(A2, "-", "")',
    exampleExplanation: 'Removes dashes from a phone number or SKU (e.g., "555-0199" becomes "5550199").',
    sampleTable: {
      headers: ['Original (A)', 'Formula', 'Cleaned'],
      rows: [
        ['123-456-7890', '=SUBSTITUTE(A2, "-", "")', '1234567890'],
      ],
      resultRow: { formula: '=SUBSTITUTE("123-456", "-", "/")', result: '123/456', note: 'Replaced hyphens with slashes' },
    },
    arguments: [
      { name: 'text', required: true, description: 'The text or cell containing text to substitute.' },
      { name: 'old_text', required: true, description: 'The text string you want to replace.' },
      { name: 'new_text', required: true, description: 'The text string to replace with.' },
      { name: 'instance_num', required: false, description: 'Which occurrence of old_text to replace. If omitted, every occurrence is replaced.' },
    ],
    tips: [
      'To remove text, make new_text an empty string: `""`.',
    ],
  },

  // ================= DATE & TIME =================
  {
    name: 'DATEDIF',
    category: 'date',
    badge: 'Age & Duration',
    syntax: '=DATEDIF(start_date, end_date, unit)',
    description: 'Calculates the number of days, months, or years between two dates. Ideal for calculating employee tenure, age, or project timelines.',
    exampleFormula: '=DATEDIF(A2, TODAY(), "Y")',
    exampleExplanation: 'Calculates complete years of age or tenure between date in A2 and today.',
    sampleTable: {
      headers: ['Start Date (A)', 'End Date (B)', 'Unit', 'Result'],
      rows: [
        ['2020-01-15', '2026-11-03', '"Y"', '6 Years'],
        ['2020-01-15', '2026-11-03', '"M"', '81 Months'],
      ],
      resultRow: { formula: '=DATEDIF("2020-01-15", "2026-11-03", "Y")', result: '6', note: '6 full years elapsed' },
    },
    arguments: [
      { name: 'start_date', required: true, description: 'The starting date of the period.' },
      { name: 'end_date', required: true, description: 'The ending date. Must be on or after start_date.' },
      { name: 'unit', required: true, description: '"Y" for years, "M" for months, "D" for days, "YM" for months excluding years, "MD" for days excluding months.' },
    ],
    tips: [
      'DATEDIF is a compatibility function; Excel won’t show autocomplete hints for it, but it works reliably in all versions.',
    ],
  },
  {
    name: 'NETWORKDAYS',
    category: 'date',
    badge: 'Business Days',
    syntax: '=NETWORKDAYS(start_date, end_date, [holidays])',
    description: 'Returns the number of whole working days between two dates, automatically excluding Saturdays, Sundays, and optional public holidays.',
    exampleFormula: '=NETWORKDAYS(A2, B2, $H$2:$H$10)',
    exampleExplanation: 'Calculates actual workdays between start date (A2) and delivery date (B2), skipping weekends and dates listed in holiday range H2:H10.',
    sampleTable: {
      headers: ['Start (A)', 'End (B)', 'Workdays'],
      rows: [
        ['2026-11-02 (Mon)', '2026-11-13 (Fri)', '10 Workdays'],
      ],
      resultRow: { formula: '=NETWORKDAYS("2026-11-02", "2026-11-13")', result: '10', note: 'Excludes 4 weekend days' },
    },
    arguments: [
      { name: 'start_date', required: true, description: 'The start date.' },
      { name: 'end_date', required: true, description: 'The end date.' },
      { name: 'holidays', required: false, description: 'An optional range of one or more holiday dates to exclude from the count.' },
    ],
    tips: [
      'Use NETWORKDAYS.INTL if your work week uses different weekend days (e.g., Friday & Saturday in the Middle East).',
    ],
  },

  // ================= DYNAMIC ARRAYS =================
  {
    name: 'UNIQUE',
    category: 'dynamic',
    badge: 'Deduplication',
    syntax: '=UNIQUE(array, [by_col], [exactly_once])',
    description: 'Returns a list of unique values from a range or array, eliminating all duplicate rows or items automatically.',
    exampleFormula: '=UNIQUE(A2:A100)',
    exampleExplanation: 'Extracts a distinct list of customer names or categories from column A, spilling downwards automatically.',
    sampleTable: {
      headers: ['Raw List (A)', 'Unique Output'],
      rows: [
        ['North', 'North'],
        ['South', 'South'],
        ['North', 'East'],
        ['East', ''],
      ],
      resultRow: { formula: '=UNIQUE(A2:A5)', result: 'North, South, East', note: 'Deduped dynamically' },
    },
    arguments: [
      { name: 'array', required: true, description: 'The range or array from which to extract unique values.' },
      { name: 'by_col', required: false, description: 'FALSE to compare rows (default); TRUE to compare columns.' },
      { name: 'exactly_once', required: false, description: 'FALSE to return distinct values (default); TRUE to return only items that appear exactly once.' },
    ],
    tips: [
      'Combine with SORT: =SORT(UNIQUE(A2:A50)) generates an alphabetical deduplicated dropdown list.',
    ],
  },
  {
    name: 'FILTER',
    category: 'dynamic',
    badge: 'Dynamic Extraction',
    syntax: '=FILTER(array, include, [if_empty])',
    description: 'Filters a range of data based on criteria you define, returning only matching rows into a new dynamic table array.',
    exampleFormula: '=FILTER(A2:D50, C2:C50="Pending", "No records")',
    exampleExplanation: 'Extracts all rows from A2:D50 where status in column C is "Pending". Returns "No records" if none match.',
    sampleTable: {
      headers: ['ID', 'Client', 'Status', 'Amount'],
      rows: [
        ['101', 'Acme Corp', 'Pending', '$4,000'],
        ['102', 'Beta LLC', 'Paid', '$2,500'],
        ['103', 'Gamma Inc', 'Pending', '$6,200'],
      ],
      resultRow: { formula: '=FILTER(A2:D4, C2:C4="Pending")', result: '2 matching rows spilled', note: 'Extracts rows 101 and 103' },
    },
    arguments: [
      { name: 'array', required: true, description: 'The range of cells to filter.' },
      { name: 'include', required: true, description: 'A boolean array with the same height/width as array (e.g. C2:C50="Pending").' },
      { name: 'if_empty', required: false, description: 'Value to return if no rows satisfy the condition.' },
    ],
    tips: [
      'Multiple conditions with AND logic: =FILTER(A2:D50, (B2:B50="Sales") * (D2:D50>1000)).',
      'Multiple conditions with OR logic: =FILTER(A2:D50, (B2:B50="Sales") + (B2:B50="Marketing")).',
    ],
  },
];

/**
 * Split formula arguments respecting nested parentheses and string literals
 */
export function parseFormulaArguments(argsString) {
  const args = [];
  let current = '';
  let parenDepth = 0;
  let inQuotes = false;

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    if (char === '"' && argsString[i - 1] !== '\\') {
      inQuotes = !inQuotes;
      current += char;
    } else if (inQuotes) {
      current += char;
    } else if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth--;
      current += char;
    } else if ((char === ',' || char === ';') && parenDepth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

/**
 * Intelligent Excel Formula Analyzer, Explainer & Fixer
 */
export function analyzeExcelFormula(rawInput) {
  if (!rawInput || !rawInput.trim()) {
    return null;
  }

  const raw = rawInput.trim();
  const suggestions = [];
  const warnings = [];
  const errors = [];
  const executionSteps = [];

  let cleaned = raw;
  let hasEqualsSign = true;

  // 1. Check leading '='
  if (!cleaned.startsWith('=')) {
    hasEqualsSign = false;
    warnings.push('Excel formulas must begin with an equal sign (=).');
    cleaned = '=' + cleaned;
    suggestions.push(`Add "=" at the start: ${cleaned}`);
  }

  // 2. Parentheses Balance Check
  let openParen = 0;
  let closeParen = 0;
  let inQuotes = false;
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (c === '"') inQuotes = !inQuotes;
    if (!inQuotes) {
      if (c === '(') openParen++;
      if (c === ')') closeParen++;
    }
  }

  let balancedFormula = cleaned;
  if (openParen > closeParen) {
    const missing = openParen - closeParen;
    const parenStr = ')'.repeat(missing);
    balancedFormula = cleaned + parenStr;
    errors.push(`Missing ${missing} closing parenthesis "${parenStr}".`);
    suggestions.push(`Close remaining parentheses: ${balancedFormula}`);
  } else if (closeParen > openParen) {
    const extra = closeParen - openParen;
    errors.push(`Formula has ${extra} extra closing parenthesis ")".`);
  }

  // 3. Extract Function Name
  const matchFunc = cleaned.match(/^=([A-Za-z0-9_.]+)\s*\((.*)\)$/s);
  let functionName = '';
  let argsString = '';

  if (matchFunc) {
    functionName = matchFunc[1].toUpperCase();
    argsString = matchFunc[2];
  } else {
    // Try without outermost balanced paren
    const simpleMatch = cleaned.match(/^=([A-Za-z0-9_.]+)\s*\((.*)/s);
    if (simpleMatch) {
      functionName = simpleMatch[1].toUpperCase();
      argsString = simpleMatch[2].replace(/\)+$/, '');
    }
  }

  // 4. Find Known Definition
  const knownDef = EXCEL_FORMULAS_DATABASE.find((f) => f.name.toUpperCase() === functionName);

  // 5. Detect Semicolon vs Comma
  if (cleaned.includes(';') && !cleaned.includes(',')) {
    warnings.push('Formula uses semicolons (;) as delimiters (European Excel standard). If using US/International Excel, use commas (,) instead.');
  }

  // 6. Parse Top-level Arguments
  const parsedArgs = argsString ? parseFormulaArguments(argsString) : [];
  const argsAnalysis = [];

  if (knownDef && knownDef.arguments) {
    knownDef.arguments.forEach((argDef, idx) => {
      const userVal = parsedArgs[idx];
      if (userVal !== undefined) {
        argsAnalysis.push({
          name: argDef.name,
          value: userVal,
          required: argDef.required,
          description: argDef.description,
          status: 'provided',
        });
      } else if (argDef.required) {
        argsAnalysis.push({
          name: argDef.name,
          value: '(Missing)',
          required: true,
          description: argDef.description,
          status: 'missing',
        });
        errors.push(`Required parameter "${argDef.name}" is missing.`);
      }
    });

    // Check excess arguments
    if (parsedArgs.length > knownDef.arguments.length) {
      warnings.push(`Formula has ${parsedArgs.length} arguments, but ${functionName} typically expects ${knownDef.arguments.length}.`);
    }
  } else {
    // Generic function
    parsedArgs.forEach((val, idx) => {
      argsAnalysis.push({
        name: `Argument ${idx + 1}`,
        value: val,
        required: true,
        description: `Passed parameter into ${functionName || 'formula'}.`,
        status: 'provided',
      });
    });
  }

  // 7. Context-Specific Checks & Optimizations
  if (functionName === 'VLOOKUP') {
    // Check 4th argument (exact match)
    if (parsedArgs.length < 4 || (parsedArgs[3] !== 'FALSE' && parsedArgs[3] !== '0')) {
      warnings.push('VLOOKUP is missing `FALSE` as the 4th argument. By default, Excel will perform an approximate match and may return incorrect rows!');
      const corrected = cleaned.replace(/\)$/, ', FALSE)');
      suggestions.push(`Add FALSE for exact matching: ${corrected}`);
    }

    // Check table array absolute reference
    if (parsedArgs[1] && !parsedArgs[1].includes('$')) {
      suggestions.push(`Lock table range with "$" (e.g. $A$2:$D$50) so dragging formula down won't shift rows.`);
    }

    // Modern upgrade suggestion
    suggestions.push(`💡 Modern Upgrade: Replace VLOOKUP with XLOOKUP for faster lookups that won't break if columns are reordered.`);
  }

  if (functionName === 'IF') {
    // Check if user is nesting many IFs
    if (cleaned.split(/IF\(/i).length > 3) {
      suggestions.push('💡 Tip: For 3+ conditions, consider using =IFS(...) or =SWITCH(...) instead of multiple nested IF statements.');
    }
  }

  if (functionName === 'SUM') {
    if (cleaned.includes('+')) {
      suggestions.push('💡 Tip: Inside =SUM(), use commas or colons for ranges (e.g. =SUM(A1:A10)) rather than manual "+" signs.');
    }
  }

  // Double periods check (e.g. A1..A10)
  if (cleaned.includes('..')) {
    errors.push('Found ".." in cell range. Excel uses a single colon ":" for ranges (e.g., A1:B10).');
    const fixed = cleaned.replace(/\.\./g, ':');
    suggestions.push(`Fix range syntax: ${fixed}`);
  }

  // 8. Generate Natural Language Step-by-Step Execution Plan
  if (functionName === 'XLOOKUP' && parsedArgs.length >= 3) {
    executionSteps.push(`Step 1: Excel inspects the lookup value: ${parsedArgs[0]}.`);
    executionSteps.push(`Step 2: Excel scans the lookup array (${parsedArgs[1]}) to find an exact match.`);
    executionSteps.push(`Step 3: Once found, Excel retrieves and returns the corresponding value in ${parsedArgs[2]}.`);
    if (parsedArgs[3]) executionSteps.push(`Fallback: If no match is found, Excel returns ${parsedArgs[3]}.`);
  } else if (functionName === 'VLOOKUP' && parsedArgs.length >= 3) {
    executionSteps.push(`Step 1: Excel takes search key ${parsedArgs[0]}.`);
    executionSteps.push(`Step 2: Searches top-to-bottom in the FIRST column of table ${parsedArgs[1]}.`);
    executionSteps.push(`Step 3: Jumps across to column #${parsedArgs[2]} in that matching row and returns its value.`);
  } else if (functionName === 'IF' && parsedArgs.length >= 2) {
    executionSteps.push(`Step 1: Evaluates condition: "${parsedArgs[0]}".`);
    executionSteps.push(`Step 2: If the test is TRUE, returns ${parsedArgs[1]}.`);
    if (parsedArgs[2]) {
      executionSteps.push(`Step 3: If the test is FALSE, returns ${parsedArgs[2]}.`);
    }
  } else if (functionName === 'SUMIFS' && parsedArgs.length >= 3) {
    executionSteps.push(`Step 1: Evaluates criteria range ${parsedArgs[1]} for matches with ${parsedArgs[2]}.`);
    executionSteps.push(`Step 2: For all rows that satisfy all conditions, adds the numbers in ${parsedArgs[0]}.`);
  } else if (functionName) {
    executionSteps.push(`Step 1: Excel parses arguments passed into ${functionName}.`);
    executionSteps.push(`Step 2: Evaluates expressions and cell ranges inside the parentheses.`);
    executionSteps.push(`Step 3: Executes ${functionName} calculation and outputs the computed result.`);
  } else {
    executionSteps.push(`Evaluates mathematical expression: ${cleaned}`);
  }

  // Summary
  let summary = '';
  if (knownDef) {
    summary = knownDef.description;
  } else if (functionName) {
    summary = `Custom or built-in Excel function "${functionName}".`;
  } else {
    summary = 'Mathematical calculation or cell formula.';
  }

  // Best suggested formula
  let suggestedFormula = balancedFormula;
  if (suggestions.length > 0 && suggestions[0].includes('=')) {
    const candidate = suggestions[0].split(': ')[1];
    if (candidate && candidate.startsWith('=')) {
      suggestedFormula = candidate;
    }
  }

  return {
    rawFormula: raw,
    cleanedFormula: cleaned,
    suggestedFormula,
    functionName: functionName || 'EXPRESSION',
    category: knownDef ? knownDef.category : 'general',
    summary,
    knownDef,
    argsAnalysis,
    executionSteps,
    suggestions,
    warnings,
    errors,
    isValid: errors.length === 0,
  };
}

