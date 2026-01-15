import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, Loader2 } from 'lucide-react';
import { SessionFilter, SessionLocation, SessionType, SessionStatus } from '@/lib/types/session';

interface CalendarFiltersProps {
  filters: SessionFilter;
  onFilterChange: (filters: SessionFilter) => void;
  onClearFilters: () => void;
  filterOptions?: {
    teachers: Array<{ id: string; name: string }>;
    students: Array<{ id: string; name: string }>;
    subjects: string[];
    locations: string[];
    session_types: string[];
    statuses: string[];
  };
  isLoading?: boolean;
}

export function CalendarFilters({ filters, onFilterChange, onClearFilters, filterOptions, isLoading = false }: CalendarFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');
  
  // Debug logging
  console.log('CalendarFilters - filterOptions:', filterOptions);
  console.log('CalendarFilters - isLoading:', isLoading);

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
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Loading...
                </SelectItem>
              ) : (
                filterOptions?.teachers?.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                )) || null
              )}
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
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Loading...
                </SelectItem>
              ) : (
                filterOptions?.students?.map(student => (
                  <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                )) || null
              )}
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
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Loading...
                </SelectItem>
              ) : (
                filterOptions?.subjects?.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                )) || null
              )}
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
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Loading...
                </SelectItem>
              ) : (
                filterOptions?.locations?.map(location => (
                  <SelectItem key={location} value={location}>{location.charAt(0).toUpperCase() + location.slice(1)}</SelectItem>
                )) || null
              )}
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
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Loading...
                </SelectItem>
              ) : (
                filterOptions?.session_types?.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                )) || null
              )}
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
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Loading...
                </SelectItem>
              ) : (
                filterOptions?.statuses?.map(status => (
                  <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}</SelectItem>
                )) || null
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
