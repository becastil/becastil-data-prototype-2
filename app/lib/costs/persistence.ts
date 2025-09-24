import Dexie, { Table } from 'dexie'
import type { TableRow, TableData } from './schema'
import { TableDataSchema } from './schema'

// Database interface
export interface SavedCostData {
  id?: number
  name: string
  rows: TableRow[]
  version: number
  createdAt: Date
  updatedAt: Date
  description?: string
}

// Dexie database class
export class HealthcareCosts2024DB extends Dexie {
  savedData!: Table<SavedCostData>

  constructor() {
    super('HealthcareCosts2024')
    
    this.version(1).stores({
      savedData: '++id, name, updatedAt, createdAt'
    })
  }
}

// Create database instance
export const db = new HealthcareCosts2024DB()

// Draft management
export class DraftManager {
  private static DRAFT_PREFIX = 'draft_'
  private static AUTO_SAVE_KEY = 'auto_save'
  
  /**
   * Save draft with auto-generated name
   */
  static async saveAutoDraft(rows: TableRow[]): Promise<void> {
    try {
      const data: SavedCostData = {
        name: this.AUTO_SAVE_KEY,
        rows,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Auto-saved draft'
      }
      
      // Validate data before saving
      TableDataSchema.parse({ rows, version: 1, lastModified: new Date() })
      
      // Update existing auto-save or create new one
      const existing = await db.savedData.where('name').equals(this.AUTO_SAVE_KEY).first()
      
      if (existing) {
        await db.savedData.update(existing.id!, {
          rows,
          updatedAt: new Date()
        })
      } else {
        await db.savedData.add(data)
      }
      
    } catch (error) {
      console.error('Failed to save auto-draft:', error)
      throw new Error('Failed to save draft automatically')
    }
  }
  
  /**
   * Load auto-saved draft
   */
  static async loadAutoDraft(): Promise<TableRow[] | null> {
    try {
      const draft = await db.savedData.where('name').equals(this.AUTO_SAVE_KEY).first()
      return draft?.rows || null
    } catch (error) {
      console.error('Failed to load auto-draft:', error)
      return null
    }
  }
  
  /**
   * Check if auto-draft exists
   */
  static async hasAutoDraft(): Promise<boolean> {
    try {
      const draft = await db.savedData.where('name').equals(this.AUTO_SAVE_KEY).first()
      return !!draft
    } catch (error) {
      console.error('Failed to check auto-draft:', error)
      return false
    }
  }
  
  /**
   * Save named draft
   */
  static async saveNamedDraft(name: string, rows: TableRow[], description?: string): Promise<number> {
    try {
      // Validate data
      TableDataSchema.parse({ rows, version: 1, lastModified: new Date() })
      
      const data: SavedCostData = {
        name: `${this.DRAFT_PREFIX}${name}`,
        rows,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        description
      }
      
      return await db.savedData.add(data)
    } catch (error) {
      console.error('Failed to save named draft:', error)
      throw new Error(`Failed to save draft "${name}"`)
    }
  }
  
  /**
   * Load named draft
   */
  static async loadNamedDraft(name: string): Promise<TableRow[] | null> {
    try {
      const draft = await db.savedData.where('name').equals(`${this.DRAFT_PREFIX}${name}`).first()
      return draft?.rows || null
    } catch (error) {
      console.error('Failed to load named draft:', error)
      throw new Error(`Failed to load draft "${name}"`)
    }
  }
  
  /**
   * List all saved drafts
   */
  static async listDrafts(): Promise<Array<{
    id: number
    name: string
    description?: string
    updatedAt: Date
    rowCount: number
  }>> {
    try {
      const drafts = await db.savedData
        .where('name')
        .startsWith(this.DRAFT_PREFIX)
        .toArray()
      
      return drafts.map(draft => ({
        id: draft.id!,
        name: draft.name.replace(this.DRAFT_PREFIX, ''),
        description: draft.description,
        updatedAt: draft.updatedAt,
        rowCount: draft.rows.length
      }))
    } catch (error) {
      console.error('Failed to list drafts:', error)
      return []
    }
  }
  
  /**
   * Delete draft by name
   */
  static async deleteDraft(name: string): Promise<void> {
    try {
      await db.savedData.where('name').equals(`${this.DRAFT_PREFIX}${name}`).delete()
    } catch (error) {
      console.error('Failed to delete draft:', error)
      throw new Error(`Failed to delete draft "${name}"`)
    }
  }
  
  /**
   * Clear auto-save draft
   */
  static async clearAutoDraft(): Promise<void> {
    try {
      await db.savedData.where('name').equals(this.AUTO_SAVE_KEY).delete()
    } catch (error) {
      console.error('Failed to clear auto-draft:', error)
    }
  }
  
  /**
   * Export all data for backup
   */
  static async exportAllData(): Promise<SavedCostData[]> {
    try {
      return await db.savedData.toArray()
    } catch (error) {
      console.error('Failed to export data:', error)
      return []
    }
  }
  
  /**
   * Import data from backup
   */
  static async importData(data: SavedCostData[]): Promise<void> {
    try {
      await db.transaction('rw', db.savedData, async () => {
        // Validate each item
        for (const item of data) {
          TableDataSchema.parse({ 
            rows: item.rows, 
            version: item.version, 
            lastModified: item.updatedAt 
          })
        }
        
        // Clear existing data
        await db.savedData.clear()
        
        // Import new data
        await db.savedData.bulkAdd(data)
      })
    } catch (error) {
      console.error('Failed to import data:', error)
      throw new Error('Failed to import backup data')
    }
  }
  
  /**
   * Get storage usage statistics
   */
  static async getStorageStats(): Promise<{
    totalDrafts: number
    storageUsed: number
    oldestDraft: Date | null
    newestDraft: Date | null
  }> {
    try {
      const drafts = await db.savedData.toArray()
      
      if (drafts.length === 0) {
        return {
          totalDrafts: 0,
          storageUsed: 0,
          oldestDraft: null,
          newestDraft: null
        }
      }
      
      // Rough estimate of storage (JSON string length)
      const storageUsed = JSON.stringify(drafts).length
      
      const dates = drafts.map(d => d.updatedAt).sort((a, b) => a.getTime() - b.getTime())
      
      return {
        totalDrafts: drafts.length,
        storageUsed,
        oldestDraft: dates[0],
        newestDraft: dates[dates.length - 1]
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return {
        totalDrafts: 0,
        storageUsed: 0,
        oldestDraft: null,
        newestDraft: null
      }
    }
  }
}

// Auto-save hook for React components
export function useAutoSave(rows: TableRow[], enabled: boolean = true, delay: number = 2000) {
  const [saving, setSaving] = React.useState(false)
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const timeoutRef = React.useRef<NodeJS.Timeout>()
  
  const debouncedSave = React.useCallback(async (rowsToSave: TableRow[]) => {
    if (!enabled) return
    
    try {
      setSaving(true)
      await DraftManager.saveAutoDraft(rowsToSave)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setSaving(false)
    }
  }, [enabled])
  
  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      debouncedSave(rows)
    }, delay)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [rows, debouncedSave, delay])
  
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return { saving, lastSaved }
}

// React import for the hook
import React from 'react'

// Utility functions for storage management
export async function clearAllData(): Promise<void> {
  try {
    await db.delete()
    await db.open()
  } catch (error) {
    console.error('Failed to clear all data:', error)
    throw new Error('Failed to clear storage')
  }
}

export async function checkStorageHealth(): Promise<{
  isHealthy: boolean
  issues: string[]
}> {
  const issues: string[] = []
  
  try {
    // Check database connection
    await db.open()
    
    // Check if we can read data
    const count = await db.savedData.count()
    
    // Check for corrupted data
    const allData = await db.savedData.toArray()
    for (const item of allData) {
      try {
        TableDataSchema.parse({ 
          rows: item.rows, 
          version: item.version, 
          lastModified: item.updatedAt 
        })
      } catch {
        issues.push(`Corrupted data found for draft: ${item.name}`)
      }
    }
    
    return {
      isHealthy: issues.length === 0,
      issues
    }
  } catch (error) {
    issues.push('Database connection failed')
    return {
      isHealthy: false,
      issues
    }
  }
}