import React, { createContext, useContext, useEffect, useState } from 'react';
import { generateStudentCode } from '../services/reportService';

export type UserRole = 'student' | 'teacher' | null;

// Festes Masterpasswort für die Lehrkräfte der Regelschule Kahla
export const TEACHER_MASTER_PASSWORD = 'TIP2026';

interface AuthContextType {
  role: UserRole;
  studentCode: string;
  studentName: string;
  isLoading: boolean;
  loginAsStudent: (code: string) => Promise<void>;
  registerAndLoginStudent: (name: string) => Promise<string>;
  loginAsTeacher: (passcode: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(null);
  const [studentCode, setStudentCode] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Wiederherstellung der letzten Sitzung aus dem Browser-Speicher
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('tip_auth_role') as UserRole;
      const savedCode = localStorage.getItem('tip_auth_student_code') || '';
      const savedName = localStorage.getItem('tip_auth_student_name') || '';

      if (savedRole === 'teacher') {
        setRole('teacher');
      } else if (savedRole === 'student' && savedCode) {
        setRole('student');
        setStudentCode(savedCode);
        setStudentName(savedName);
      }
    } catch (e) {
      console.error('Fehler beim Wiederherstellen der Sitzung:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 1. Schüler-Login mit bestehendem Kürzel (z. B. 'LMUE')
  const loginAsStudent = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      throw new Error('Bitte gib ein gültiges Schüler-Kürzel ein.');
    }

    setRole('student');
    setStudentCode(cleanCode);

    localStorage.setItem('tip_auth_role', 'student');
    localStorage.setItem('tip_auth_student_code', cleanCode);
  };

  // 2. Schüler-Registrierung: Aus Name automatisches Kürzel generieren und einloggen
  const registerAndLoginStudent = async (fullName: string): Promise<string> => {
    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      throw new Error('Bitte gib deinen vollständigen Vor- und Nachnamen ein.');
    }

    const generatedCode = generateStudentCode(cleanName);
    setRole('student');
    setStudentCode(generatedCode);
    setStudentName(cleanName);

    localStorage.setItem('tip_auth_role', 'student');
    localStorage.setItem('tip_auth_student_code', generatedCode);
    localStorage.setItem('tip_auth_student_name', cleanName);

    return generatedCode;
  };

  // 3. Lehrer-Login mit Masterpasswort TIP2026
  const loginAsTeacher = async (passcode: string) => {
    const cleanPass = passcode.trim();
    if (cleanPass.toUpperCase() !== TEACHER_MASTER_PASSWORD) {
      throw new Error('Falsches Lehrer-Passwort. Bitte wende dich an die Fachschaft.');
    }

    setRole('teacher');
    setStudentCode('');
    setStudentName('');

    localStorage.setItem('tip_auth_role', 'teacher');
    localStorage.removeItem('tip_auth_student_code');
    localStorage.removeItem('tip_auth_student_name');
  };

  const logout = () => {
    setRole(null);
    setStudentCode('');
    setStudentName('');
    localStorage.removeItem('tip_auth_role');
    localStorage.removeItem('tip_auth_student_code');
    localStorage.removeItem('tip_auth_student_name');
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        studentCode,
        studentName,
        isLoading,
        loginAsStudent,
        registerAndLoginStudent,
        loginAsTeacher,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
