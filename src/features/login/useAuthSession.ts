import { useEffect, useState } from 'react';
import {
  hasFirebaseConfig,
  loginAnonymously,
  loginWithEmailPassword,
  logout,
  registerWithEmailPassword,
  subscribeAuthState,
  type User,
} from '../../services/firebaseAuth';
import { listCatalogCards, listUserDecks, saveUserDeck, type CatalogCard, type UserDeck } from '../../services/firestoreData';

type UseAuthSessionResult = {
  email: string;
  password: string;
  confirmPassword: string;
  authUser: User | null;
  authError?: string;
  decks: UserDeck[];
  catalogCards: CatalogCard[];
  deckId: string;
  selectedDeckForBuilder?: UserDeck;
  canUseFirebaseAuth: boolean;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setDeckId: (value: string) => void;
  setSelectedDeckForBuilder: (deck: UserDeck | undefined) => void;
  setAuthError: (value: string | undefined) => void;
  loginWithEmailAndPassword: () => Promise<void>;
  register: () => Promise<boolean>;
  loginAsAnonymous: () => Promise<void>;
  doLogout: () => Promise<void>;
  saveDeck: (id: string, name: string, cards: string[]) => Promise<void>;
};

export function useAuthSession(): UseAuthSessionResult {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | undefined>(undefined);
  const [deckId, setDeckId] = useState('');
  const [decks, setDecks] = useState<UserDeck[]>([]);
  const [catalogCards, setCatalogCards] = useState<CatalogCard[]>([]);
  const [selectedDeckForBuilder, setSelectedDeckForBuilder] = useState<UserDeck | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = subscribeAuthState((user) => {
      setAuthUser(user);
      setAuthError(undefined);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authUser) {
      setDecks([]);
      setCatalogCards([]);
      setDeckId('');
      return;
    }

    const loadFirestoreData = async () => {
      const [loadedDecks, loadedCatalog] = await Promise.all([listUserDecks(authUser.uid), listCatalogCards()]);
      setDecks(loadedDecks);
      setCatalogCards(loadedCatalog);
      setDeckId((current) => current || loadedDecks[0]?.id || '');
    };

    void loadFirestoreData();
  }, [authUser]);

  const loginWithEmailAndPassword = async () => {
    try {
      setAuthError(undefined);
      await loginWithEmailPassword(email, password);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Falha ao autenticar com e-mail/senha.');
    }
  };

  const register = async () => {
    if (password.length < 6) {
      setAuthError('A senha precisa ter ao menos 6 caracteres.');
      return false;
    }
    if (password !== confirmPassword) {
      setAuthError('As senhas não conferem.');
      return false;
    }

    try {
      setAuthError(undefined);
      await registerWithEmailPassword(email, password);
      return true;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Falha ao criar conta.');
      return false;
    }
  };

  const loginAsAnonymous = async () => {
    try {
      setAuthError(undefined);
      await loginAnonymously();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Falha ao autenticar anonimamente.');
    }
  };

  const doLogout = async () => {
    await logout();
  };

  const saveDeck = async (id: string, name: string, cards: string[]) => {
    if (!authUser) {
      throw new Error('Usuário não autenticado.');
    }

    await saveUserDeck(authUser.uid, id, cards, name);
    const loadedDecks = await listUserDecks(authUser.uid);
    setDecks(loadedDecks);
    setDeckId(id);
    setSelectedDeckForBuilder(loadedDecks.find((deck) => deck.id === id));
  };

  return {
    email,
    password,
    confirmPassword,
    authUser,
    authError,
    decks,
    catalogCards,
    deckId,
    selectedDeckForBuilder,
    canUseFirebaseAuth: hasFirebaseConfig,
    setEmail,
    setPassword,
    setConfirmPassword,
    setDeckId,
    setSelectedDeckForBuilder,
    setAuthError,
    loginWithEmailAndPassword,
    register,
    loginAsAnonymous,
    doLogout,
    saveDeck,
  };
}
