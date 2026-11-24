/**
 * test-validation.js — Standalone Verification Script for 7Bank Form Validation
 */

// Import compiled or transpile test
const {
  validatePhone,
  validateEmail,
  validatePhoneOrEmail,
  validateFullName,
  validateDateOfBirth,
  validatePassword,
  validateConfirmPassword,
  validateOTP,
  validateTransactionPin,
  validateConfirmPin,
  checkPasswordCriteria,
  sanitizeDateOfBirth,
  sanitizePhone,
} = require('../src/utils/validation.ts');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName}`);
  }
}

console.log('--- Testing 7Bank Validation System ---');

// 1. Phone validation
console.log('\n[1. Phone Validation]');
assert(validatePhone('').isValid === false, 'Empty phone rejected');
assert(validatePhone('090123456').isValid === false, 'Incomplete phone (9 digits) rejected');
assert(validatePhone('09012345678').isValid === false, '11 digits phone rejected');
assert(validatePhone('0123456789').isValid === false, 'Discontinued prefix 012 rejected');
assert(validatePhone('0901234567').isValid === true, 'Valid Viettel/Mobifone 090 prefix accepted');
assert(validatePhone('0398765432').isValid === true, 'Valid 039 prefix accepted');
assert(validatePhone('0868888999').isValid === true, 'Valid 086 prefix accepted');

// 2. Email validation
console.log('\n[2. Email Validation]');
assert(validateEmail('').isValid === false, 'Empty email rejected');
assert(validateEmail('invalid-email').isValid === false, 'Missing @ rejected');
assert(validateEmail('user@').isValid === false, 'Missing domain rejected');
assert(validateEmail('user@domain').isValid === false, 'Missing TLD rejected');
assert(validateEmail('user@domain.com').isValid === true, 'Valid email accepted');
assert(validateEmail('  user.name+tag@sub.domain.vn  ').isValid === true, 'Complex valid email trimmed and accepted');

// 3. Phone or Email validation
console.log('\n[3. Phone or Email Validation]');
assert(validatePhoneOrEmail('0901234567').isValid === true, 'Valid phone in union field accepted');
assert(validatePhoneOrEmail('user@7bank.vn').isValid === true, 'Valid email in union field accepted');
assert(validatePhoneOrEmail('12345').isValid === false, 'Invalid phone number rejected');
assert(validatePhoneOrEmail('notanemail@').isValid === false, 'Invalid email in union field rejected');

// 4. Vietnamese Full Name validation
console.log('\n[4. Vietnamese Full Name Validation]');
assert(validateFullName('').isValid === false, 'Empty name rejected');
assert(validateFullName('A').isValid === false, 'Single letter rejected');
assert(validateFullName('Nguyễn').isValid === false, 'Single word rejected');
assert(validateFullName('Nguyễn123 Văn').isValid === false, 'Name with numbers rejected');
assert(validateFullName('Nguyễn Văn A').isValid === true, 'Standard Vietnamese name accepted');
assert(validateFullName('Trần Thị Ánh Tuyết').isValid === true, 'Name with complex Vietnamese tones accepted');
assert(validateFullName('Lê Đình Đạt').isValid === true, 'Name with Đ character accepted');

// 5. Date of Birth validation
console.log('\n[5. Date of Birth Validation]');
assert(validateDateOfBirth('').isValid === false, 'Empty DOB rejected');
assert(validateDateOfBirth('15-08-1995').isValid === false, 'Wrong delimiter rejected');
assert(validateDateOfBirth('31/02/2023').isValid === false, 'Impossible date 31/02 rejected');
assert(validateDateOfBirth('29/02/2023').isValid === false, 'Feb 29 on non-leap year rejected');
assert(validateDateOfBirth('29/02/2024').isValid === true, 'Feb 29 on leap year 2024 accepted');
assert(validateDateOfBirth('31/04/2000').isValid === false, 'April 31 rejected (April has 30 days)');
assert(validateDateOfBirth('01/01/2099').isValid === false, 'Future date rejected');
assert(validateDateOfBirth('15/08/1995').isValid === true, 'Valid date accepted');

// 6. Password validation
console.log('\n[6. Password Validation]');
assert(validatePassword('').isValid === false, 'Empty password rejected');
assert(validatePassword('Ab1!').isValid === false, 'Short password (<8 chars) rejected');
assert(validatePassword('abcdef1!').isValid === false, 'Missing uppercase rejected');
assert(validatePassword('ABCDEF1!').isValid === false, 'Missing lowercase rejected');
assert(validatePassword('Abcdefgh!').isValid === false, 'Missing digit rejected');
assert(validatePassword('Abcdefg1').isValid === false, 'Missing special character rejected');
assert(validatePassword('Demo1234!').isValid === true, 'Valid password with all requirements accepted');

const criteria = checkPasswordCriteria('Demo1');
assert(criteria.hasMinLength === false, 'Criteria hasMinLength check');
assert(criteria.hasUppercase === true, 'Criteria hasUppercase check');
assert(criteria.hasDigit === true, 'Criteria hasDigit check');
assert(criteria.hasSpecial === false, 'Criteria hasSpecial check');

// 7. Password Confirmation
console.log('\n[7. Password Confirmation]');
assert(validateConfirmPassword('Demo1234!', 'Demo1234!').isValid === true, 'Matching password confirmation accepted');
assert(validateConfirmPassword('Demo1234!', 'Demo1234?').isValid === false, 'Mismatched password confirmation rejected');

// 8. OTP validation
console.log('\n[8. OTP Validation]');
assert(validateOTP('').isValid === false, 'Empty OTP rejected');
assert(validateOTP('12345').isValid === false, '5 digits OTP rejected');
assert(validateOTP('1234567').isValid === false, '7 digits OTP rejected');
assert(validateOTP('12345a').isValid === false, 'Non-digits OTP rejected');
assert(validateOTP('123456').isValid === true, 'Valid 6-digit OTP accepted');

// 9. Transaction PIN validation
console.log('\n[9. Transaction PIN Validation]');
assert(validateTransactionPin('').isValid === false, 'Empty PIN rejected');
assert(validateTransactionPin('12345').isValid === false, '5 digits PIN rejected');
assert(validateTransactionPin('111111').isValid === false, 'Repeated digits 111111 rejected');
assert(validateTransactionPin('999999').isValid === false, 'Repeated digits 999999 rejected');
assert(validateTransactionPin('123456').isValid === false, 'Sequential ascending 123456 rejected');
assert(validateTransactionPin('654321').isValid === false, 'Sequential descending 654321 rejected');
assert(validateTransactionPin('839201').isValid === true, 'Non-trivial 6-digit PIN accepted');

// 10. Confirm PIN validation
console.log('\n[10. Confirm PIN Validation]');
assert(validateConfirmPin('839201', '839201').isValid === true, 'Matching PIN confirmation accepted');
assert(validateConfirmPin('839201', '839202').isValid === false, 'Mismatched PIN confirmation rejected');

// 11. Sanitizers
console.log('\n[11. Sanitizers]');
assert(sanitizePhone('090 123 4567') === '0901234567', 'Phone space sanitization');
assert(sanitizeDateOfBirth('15081995') === '15/08/1995', 'DOB auto-formatting');

console.log(`\n========================================`);
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
