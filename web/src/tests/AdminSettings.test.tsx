import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminSettings from '../pages/AdminSettings';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import type { Mocked } from 'vitest';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as Mocked<typeof axios>;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdminSettings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {})); // Never resolves
    renderWithProviders(<AdminSettings />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error message if API fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));
    
    renderWithProviders(<AdminSettings />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load admin data/i)).toBeInTheDocument();
    });
  });

  it('renders data correctly when API succeeds', async () => {
    const mockConfig = {
      agentConfig: { scout: { enabled: true, concurrency: 2 }, report: { enabled: false } },
      featureFlags: { scholarships: true },
      dataRetentionMonths: 12,
      updatedAt: new Date().toISOString(),
    };
    
    const mockStudents = [
      { id: 1, name: 'Alice', grade: 10, gpa: 3.8, riskLevel: 'Low' }
    ];

    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/api/admin/config') return Promise.resolve({ data: mockConfig });
      if (url === '/api/counselor/students') return Promise.resolve({ data: mockStudents });
      return Promise.reject(new Error('Not found'));
    });

    renderWithProviders(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByText(/Admin Control Panel/i)).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });
});
