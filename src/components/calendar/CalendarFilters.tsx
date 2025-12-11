import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { SessionFilter, SessionLocation, SessionType, SessionStatus } from '@/lib/types/session';

interface CalendarFiltersProps {
  filters: SessionFilter;
  onFilterChange: (filters: SessionFilter) => void;
  onClearFilters: () => void;
}

// Mock data - replace with actual data
const mockTeachers = [
  { id: 'tutor-1', name: 'Dr. Michael Rodriguez' },
  { id: 'tutor-2', name: 'Sarah Chen' },
  { id: 'tutor-3', name: 'James Wilson' },
];

const mockStudents = [
  { id: 'student-1', name: 'Emma Thompson' },
  { id: 'student-2', name: 'Sampoorna Arora' },
  { id: 'student-3', name: 'Xavier Dean' },
];

const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'];

export function CalendarFilters({ filters, onFilterChange, onClearFilters }: CalendarFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <div className="bg-card p-4 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Teacher Filter */}
        <div>
          <Label>Teacher</Label>
          <Select 
            value={filters.teacherId || 'all'} 
            onValueChange={(value) => onFilterChange({ ...filters, teacherId: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Teachers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {mockTeachers.map(teacher => (
                <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Student Filter */}
        <div>
          <Label>Student</Label>
          <Select 
            value={filters.studentId || 'all'} 
            onValueChange={(value) => onFilterChange({ ...filters, studentId: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Students" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {mockStudents.map(student => (
                <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subject Filter */}
        <div>
          <Label>Subject</Label>
          <Select 
            value={filters.subject || 'all'} 
            onValueChange={(value) => onFilterChange({ ...filters, subject: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div>
          <Label>Location</Label>
          <Select 
            value={filters.location || 'all'} 
            onValueChange={(value) => onFilterChange({ ...filters, location: value === 'all' ? undefined : value as SessionLocation })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="centre">Centre</SelectItem>
              <SelectItem value="home">Home</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Session Type Filter */}
        <div>
          <Label>Session Type</Label>
          <Select 
            value={filters.sessionType || 'all'} 
            onValueChange={(value) => onFilterChange({ ...filters, sessionType: value === 'all' ? undefined : value as SessionType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="1:1">1:1</SelectItem>
              <SelectItem value="group">Group</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <Label>Status</Label>
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(value) => onFilterChange({ ...filters, status: value === 'all' ? undefined : value as SessionStatus })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no-show">No-show</SelectItem>
              <SelectItem value="rescheduled">Rescheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
