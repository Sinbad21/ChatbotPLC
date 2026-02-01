import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, validatePassword } from './password';

describe('Password Module', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed).not.toBe(password); // Should not be plain text
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'SamePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // bcrypt uses salt, so hashes differ
    });

    it('should hash various password types', async () => {
      const passwords = [
        'Simple123!',
        'Complex$Pass123',
        '!@#$%^&*()_+',
        'VeryLongPasswordWithManyCharacters123!',
      ];

      for (const password of passwords) {
        const hashed = await hashPassword(password);
        expect(hashed).toBeDefined();
        expect(hashed).not.toBe(password);
      }
    });

    it('should create bcrypt format hash', async () => {
      const password = 'BcryptFormat123!';
      const hashed = await hashPassword(password);

      // Bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hashed).toMatch(/^\$2[aby]\$\d+\$/);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'CorrectPassword123!';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword(password, hashed);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword(wrongPassword, hashed);

      expect(isMatch).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const password = 'CaseSensitive123!';
      const hashed = await hashPassword(password);

      const lowerCase = await comparePassword('casesensitive123!', hashed);
      const upperCase = await comparePassword('CASESENSITIVE123!', hashed);

      expect(lowerCase).toBe(false);
      expect(upperCase).toBe(false);
    });

    it('should detect even small differences', async () => {
      const password = 'TestPassword123!';
      const hashed = await hashPassword(password);

      const tests = [
        'TestPassword123',    // Missing !
        'TestPassword123!!',  // Extra !
        'TestPassword 123!',  // Extra space
        'testPassword123!',   // Different case
        'TestPassword1234!',  // Extra digit
      ];

      for (const testPassword of tests) {
        const isMatch = await comparePassword(testPassword, hashed);
        expect(isMatch).toBe(false);
      }
    });

    it('should handle empty string correctly', async () => {
      const password = 'ValidPassword123!';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword('', hashed);

      expect(isMatch).toBe(false);
    });

    it('should work with special characters', async () => {
      const password = '!@#$%^&*()_+{}[]|:;"<>?,./~`';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword(password, hashed);

      expect(isMatch).toBe(true);
    });
  });

  describe('validatePassword', () => {
    describe('Valid Passwords', () => {
      it('should validate a strong password', () => {
        const result = validatePassword('StrongPass123!');

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept various valid passwords', () => {
        const validPasswords = [
          'Password123!',
          'MySecure$Pass1',
          'Complex@Pass123',
          'Str0ng!Password',
          'Test#123Pass',
        ];

        validPasswords.forEach((password) => {
          const result = validatePassword(password);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });
      });

      it('should accept long passwords', () => {
        const longPassword = 'ThisIsAVeryLongPassword123!WithManyCharacters';
        const result = validatePassword(longPassword);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Invalid Passwords', () => {
      it('should reject password shorter than 8 characters', () => {
        const result = validatePassword('Pass1!');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });

      it('should reject password without uppercase letter', () => {
        const result = validatePassword('password123!');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
      });

      it('should reject password without lowercase letter', () => {
        const result = validatePassword('PASSWORD123!');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
      });

      it('should reject password without number', () => {
        const result = validatePassword('PasswordNoNum!');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number');
      });

      it('should reject password without special character', () => {
        const result = validatePassword('Password123');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one special character');
      });

      it('should return multiple errors for weak password', () => {
        const result = validatePassword('weak');

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
        expect(result.errors).toContain('Password must be at least 8 characters long');
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).toContain('Password must contain at least one number');
        expect(result.errors).toContain('Password must contain at least one special character');
      });

      it('should reject empty password', () => {
        const result = validatePassword('');

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should reject password with only lowercase', () => {
        const result = validatePassword('lowercaseonly');

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(2);
      });
    });

    describe('Edge Cases', () => {
      it('should validate password with exactly 8 characters', () => {
        const result = validatePassword('Pass123!');

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept all special characters', () => {
        const specialChars = '!@#$%^&*(),.?":{}|<>';
        const password = `Pass123${specialChars}`;
        const result = validatePassword(password);

        expect(result.valid).toBe(true);
      });

      it('should handle unicode characters gracefully', () => {
        const password = 'Pāšš123!😀'; // Contains unicode
        const result = validatePassword(password);

        // Should still validate basic requirements
        expect(result.errors.length).toBeLessThanOrEqual(5);
      });

      it('should reject password with only spaces', () => {
        const result = validatePassword('        ');

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Password Module Integration', () => {
    it('should hash and verify valid password end-to-end', async () => {
      const password = 'ValidPass123!';

      // Validate
      const validation = validatePassword(password);
      expect(validation.valid).toBe(true);

      // Hash
      const hashed = await hashPassword(password);
      expect(hashed).toBeDefined();

      // Compare
      const isMatch = await comparePassword(password, hashed);
      expect(isMatch).toBe(true);
    });

    it('should reject invalid password before hashing', async () => {
      const weakPassword = 'weak';

      // Validate first
      const validation = validatePassword(weakPassword);
      expect(validation.valid).toBe(false);

      // In real application, we wouldn't hash invalid passwords
      // But technically bcrypt can hash any string
      const hashed = await hashPassword(weakPassword);
      expect(hashed).toBeDefined();
    });

    it('should handle multiple users with same password', async () => {
      const password = 'SharedPass123!';

      // Two users use same password
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Hashes should be different (salt)
      expect(hash1).not.toBe(hash2);

      // But both should verify correctly
      const match1 = await comparePassword(password, hash1);
      const match2 = await comparePassword(password, hash2);

      expect(match1).toBe(true);
      expect(match2).toBe(true);
    });

    it('should handle password change scenario', async () => {
      const oldPassword = 'OldPass123!';
      const newPassword = 'NewPass456!';

      // Validate both passwords
      expect(validatePassword(oldPassword).valid).toBe(true);
      expect(validatePassword(newPassword).valid).toBe(true);

      // Hash old password
      const oldHash = await hashPassword(oldPassword);

      // Verify old password works
      expect(await comparePassword(oldPassword, oldHash)).toBe(true);

      // Hash new password
      const newHash = await hashPassword(newPassword);

      // Old password shouldn't match new hash
      expect(await comparePassword(oldPassword, newHash)).toBe(false);

      // New password should match new hash
      expect(await comparePassword(newPassword, newHash)).toBe(true);
    });
  });
});
