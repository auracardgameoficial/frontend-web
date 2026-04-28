import { fireEvent, render, screen, waitFor } from '@testing-library/react';
// @ts-ignore importing explicit extension to avoid .js shadow files during tests
import App from './App.tsx';

type MockUser = { uid: string; getIdToken: () => Promise<string> };

type AuthListener = (user: MockUser | null) => void;

let authListener: AuthListener | null = null;
const mockUser: MockUser = {
  uid: 'user-123',
  getIdToken: async () => 'token-123',
};

vi.mock('./config.ts', () => ({
  API_URL: 'http://localhost:3000',
  ENABLE_MOCK_MODE: true,
}));

vi.mock('./services/firebaseAuth.ts', () => ({
  hasFirebaseConfig: true,
  subscribeAuthState: (listener: AuthListener) => {
    authListener = listener;
    listener(null);
    return () => {
      authListener = null;
    };
  },
  loginWithEmailPassword: vi.fn(async () => {
    authListener?.(mockUser);
  }),
  registerWithEmailPassword: vi.fn(),
  loginAnonymously: vi.fn(),
  logout: vi.fn(async () => {
    authListener?.(null);
  }),
}));

vi.mock('./services/firestoreData.ts', () => ({
  listCatalogCards: vi.fn(async () => []),
  listUserDecks: vi.fn(async () => [{ id: 'deck-1', nome: 'Deck Inicial', cartas: [] }]),
  saveUserDeck: vi.fn(),
}));

describe('App flow integration', () => {
  it('executa fluxo mínimo de login para lobby e matchmaking', async () => {
    render(<App />);

    expect(screen.getByText(/Fluxo:/)).toHaveTextContent('login');

    fireEvent.click(screen.getByRole('button', { name: 'Entrar com e-mail/senha' }));

    await waitFor(() => {
      expect(screen.getByText(/Usuário autenticado:/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continuar para o HUB' }));

    await screen.findByText('HUB Principal');

    fireEvent.click(screen.getByRole('button', { name: /Encontrar partida/ }));

    await waitFor(() => {
      expect(screen.getByText(/Fluxo:/)).toHaveTextContent('matchmaking');
    });

    expect(screen.getByText(/Mock: buscando oponente visual/)).toBeInTheDocument();
  }, 10000);
});
