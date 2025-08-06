import * as SQLite from 'expo-sqlite';
import { User, Organization, Employee, AttendanceRecord, LeaveRequest } from '../types';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('attendance_manager.db');
      await this.createTables();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        profile_image TEXT,
        created_at TEXT NOT NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        radius INTEGER NOT NULL,
        working_hours_start TEXT NOT NULL,
        working_hours_end TEXT NOT NULL,
        working_days TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        employee_id TEXT NOT NULL,
        department TEXT NOT NULL,
        position TEXT NOT NULL,
        profile_image TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (organization_id) REFERENCES organizations (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        date TEXT NOT NULL,
        check_in_time TEXT,
        check_in_latitude REAL,
        check_in_longitude REAL,
        check_in_photo TEXT,
        check_out_time TEXT,
        check_out_latitude REAL,
        check_out_longitude REAL,
        check_out_photo TEXT,
        status TEXT NOT NULL,
        working_hours REAL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES employees (id),
        FOREIGN KEY (organization_id) REFERENCES organizations (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS leave_requests (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        type TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES employees (id),
        FOREIGN KEY (organization_id) REFERENCES organizations (id)
      )`
    ];

    for (const query of queries) {
      await this.db.execAsync(query);
    }
  }

  // User operations
  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    
    await this.db.runAsync(
      'INSERT INTO users (id, email, name, role, profile_image, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, user.email, user.name, user.role, user.profileImage || null, createdAt]
    );
    
    return id;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync<any>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (!result) return null;
    
    return {
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
      profileImage: result.profile_image,
      createdAt: result.created_at
    };
  }

  // Organization operations
  async createOrganization(org: Omit<Organization, 'id' | 'createdAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    
    await this.db.runAsync(
      `INSERT INTO organizations (id, name, address, latitude, longitude, radius, 
       working_hours_start, working_hours_end, working_days, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, org.name, org.address, org.latitude, org.longitude, org.radius,
        org.workingHours.start, org.workingHours.end, JSON.stringify(org.workingDays),
        createdAt
      ]
    );
    
    return id;
  }

  async getOrganizations(): Promise<Organization[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const results = await this.db.getAllAsync<any>('SELECT * FROM organizations ORDER BY created_at DESC');
    
    return results.map(row => ({
      id: row.id,
      name: row.name,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      radius: row.radius,
      workingHours: {
        start: row.working_hours_start,
        end: row.working_hours_end
      },
      workingDays: JSON.parse(row.working_days),
      createdAt: row.created_at
    }));
  }

  // Employee operations
  async createEmployee(employee: Omit<Employee, 'id' | 'createdAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    
    await this.db.runAsync(
      `INSERT INTO employees (id, organization_id, email, name, employee_id, 
       department, position, profile_image, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, employee.organizationId, employee.email, employee.name, employee.employeeId,
        employee.department, employee.position, employee.profileImage || null,
        employee.isActive ? 1 : 0, createdAt
      ]
    );
    
    return id;
  }

  async getEmployees(organizationId: string): Promise<Employee[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const results = await this.db.getAllAsync<any>(
      'SELECT * FROM employees WHERE organization_id = ? ORDER BY name',
      [organizationId]
    );
    
    return results.map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      email: row.email,
      name: row.name,
      employeeId: row.employee_id,
      department: row.department,
      position: row.position,
      profileImage: row.profile_image,
      isActive: row.is_active === 1,
      createdAt: row.created_at
    }));
  }

  // Attendance operations
  async markAttendance(record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    
    await this.db.runAsync(
      `INSERT INTO attendance_records (id, employee_id, organization_id, date, 
       check_in_time, check_in_latitude, check_in_longitude, check_in_photo,
       check_out_time, check_out_latitude, check_out_longitude, check_out_photo,
       status, working_hours, notes, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, record.employeeId, record.organizationId, record.date,
        record.checkIn?.time || null, record.checkIn?.latitude || null,
        record.checkIn?.longitude || null, record.checkIn?.photo || null,
        record.checkOut?.time || null, record.checkOut?.latitude || null,
        record.checkOut?.longitude || null, record.checkOut?.photo || null,
        record.status, record.workingHours || null, record.notes || null,
        now, now
      ]
    );
    
    return id;
  }

  async getAttendanceRecords(employeeId: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    let query = 'SELECT * FROM attendance_records WHERE employee_id = ?';
    const params: any[] = [employeeId];
    
    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY date DESC';
    
    const results = await this.db.getAllAsync<any>(query, params);
    
    return results.map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      organizationId: row.organization_id,
      date: row.date,
      checkIn: row.check_in_time ? {
        time: row.check_in_time,
        latitude: row.check_in_latitude,
        longitude: row.check_in_longitude,
        photo: row.check_in_photo
      } : undefined,
      checkOut: row.check_out_time ? {
        time: row.check_out_time,
        latitude: row.check_out_latitude,
        longitude: row.check_out_longitude,
        photo: row.check_out_photo
      } : undefined,
      status: row.status,
      workingHours: row.working_hours,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const updatedAt = new Date().toISOString();
    
    // Build dynamic update query based on provided fields
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.checkOut) {
      fields.push('check_out_time = ?', 'check_out_latitude = ?', 'check_out_longitude = ?', 'check_out_photo = ?');
      values.push(updates.checkOut.time, updates.checkOut.latitude, updates.checkOut.longitude, updates.checkOut.photo || null);
    }
    
    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    
    if (updates.workingHours !== undefined) {
      fields.push('working_hours = ?');
      values.push(updates.workingHours);
    }
    
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    
    fields.push('updated_at = ?');
    values.push(updatedAt, id);
    
    const query = `UPDATE attendance_records SET ${fields.join(', ')} WHERE id = ?`;
    await this.db.runAsync(query, values);
  }
}

export const databaseService = new DatabaseService();