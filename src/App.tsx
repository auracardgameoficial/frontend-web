import { useState } from 'react';
import { CollectionView } from './features/deck-builder/CollectionView';
import { DeckBuilderView } from './features/deck-builder/DeckBuilderView';
import { LobbyView } from './features/lobby/LobbyView';
import { LoginView } from './features/login/LoginView';
import { RegisterView } from './features/login/RegisterView';
import { useAuthSession } from './features/login/useAuthSession';
import { MatchmakingView } from './features/matchmaking/MatchmakingView';
import { PartidaView } from './features/partida/PartidaView';
import { useMatchSession } from './features/partida/useMatchSession';
import { ResultadoView } from './features/resultado/ResultadoView';
import type { FlowStep, SessionState } from './types/app-state';
import { SOCKET_CONTRACT_VERSION } from './contracts/socket-contracts';
import { ENABLE_MOCK_MODE } from './config';

const CAN_USE_MOCK_MODE = ENABLE_MOCK_MODE;

export default function App() {
  const [step, setStep] = useState<FlowStep>('login');
  const [deckErrorMessage, setDeckErrorMessage] = useState<string | undefined>(undefined);

  const authSession = useAuthSession();
  const matchSession = useMatchSession({
    initialMockMode: CAN_USE_MOCK_MODE,
    onNavigate: setStep,
    onDeckValidationError: setDeckErrorMessage,
  });

  const handleRegister = async () => {
    const didRegister = await authSession.register();
    if (didRegister) {
      setStep('login');
    }
  };

  const handleLogin = async () => {
    if (!authSession.authUser) {
      authSession.setAuthError('Autentique-se antes de continuar.');
      return;
    }

    if (!authSession.deckId) {
      authSession.setAuthError('Selecione ou crie um baralho antes de continuar.');
      setStep('deckbuilder');
      return;
    }

    const idToken = await authSession.authUser.getIdToken();
    const newSession: SessionState = { token: idToken, userId: authSession.authUser.uid, deckId: authSession.deckId };
    matchSession.startSession(newSession);
  };

  const handleBuscarPartida = () => {
    if (!authSession.deckId) {
      setDeckErrorMessage('Selecione um baralho antes de buscar partida.');
      return;
    }

    setDeckErrorMessage(undefined);
    matchSession.buscarPartida(authSession.deckId);
  };

  const handleSaveDeck = async (id: string, name: string, cartas: string[]) => {
    await authSession.saveDeck(id, name, cartas);
    setDeckErrorMessage(undefined);
  };

  const handleLogout = async () => {
    matchSession.resetAfterLogout();
    await authSession.doLogout();
    setStep('login');
  };

  return (
    <main style={{ fontFamily: 'Inter, sans-serif', maxWidth: 1100, margin: '24px auto', padding: '0 16px' }}>
      <h1>Aura Cardgame Frontend</h1>
      <small>Contrato Socket {SOCKET_CONTRACT_VERSION}</small>
      <p>
        Fluxo: <strong>{step}</strong> {matchSession.mockMode ? '(mock ativo)' : '(backend online)'}
      </p>
      <p>
        Conexão: <strong>{matchSession.connection.connected ? 'online' : 'offline'}</strong>
        {matchSession.connection.reconnecting
          ? ` · reconectando (${matchSession.connection.reconnectAttempts} tentativa(s))`
          : ''}
      </p>

      {step === 'login' ? (
        <LoginView
          email={authSession.email}
          password={authSession.password}
          isAuthenticated={Boolean(authSession.authUser)}
          userId={authSession.authUser?.uid}
          authError={authSession.authError}
          mockMode={matchSession.mockMode}
          canUseMockMode={CAN_USE_MOCK_MODE}
          canUseFirebaseAuth={authSession.canUseFirebaseAuth}
          onEmailChange={authSession.setEmail}
          onPasswordChange={authSession.setPassword}
          onMockToggle={matchSession.setMockMode}
          onEmailPasswordLogin={() => void authSession.loginWithEmailAndPassword()}
          onAnonymousLogin={() => void authSession.loginAsAnonymous()}
          onGoToRegister={() => setStep('cadastro')}
          onSubmit={() => void handleLogin()}
        />
      ) : null}

      {step === 'cadastro' ? (
        <RegisterView
          email={authSession.email}
          password={authSession.password}
          confirmPassword={authSession.confirmPassword}
          authError={authSession.authError}
          canUseFirebaseAuth={authSession.canUseFirebaseAuth}
          onEmailChange={authSession.setEmail}
          onPasswordChange={authSession.setPassword}
          onConfirmPasswordChange={authSession.setConfirmPassword}
          onRegister={() => void handleRegister()}
          onBackToLogin={() => setStep('login')}
        />
      ) : null}

      {step === 'lobby' ? (
        <LobbyView
          decks={authSession.decks}
          deckId={authSession.deckId}
          deckValidationError={deckErrorMessage}
          onDeckChange={(value) => {
            authSession.setDeckId(value);
            setDeckErrorMessage(undefined);
          }}
          onBuscarPartida={handleBuscarPartida}
          onOpenCollection={() => setStep('colecao')}
          onOpenDeckBuilder={() => {
            authSession.setSelectedDeckForBuilder(authSession.decks.find((deck) => deck.id === authSession.deckId));
            setStep('deckbuilder');
          }}
          onLogout={() => void handleLogout()}
        />
      ) : null}

      {step === 'colecao' ? <CollectionView cards={authSession.catalogCards} onBack={() => setStep('lobby')} /> : null}

      {step === 'deckbuilder' ? (
        <DeckBuilderView
          cards={authSession.catalogCards}
          deck={authSession.selectedDeckForBuilder}
          onBack={() => setStep('lobby')}
          onSave={handleSaveDeck}
        />
      ) : null}

      {step === 'matchmaking' ? <MatchmakingView status={matchSession.status} /> : null}

      {step === 'partida' ? (
        <PartidaView
          sala={matchSession.match.sala}
          estado={matchSession.match.estado}
          attackSelection={matchSession.match.attackSelection}
          userId={matchSession.session?.userId ?? authSession.authUser?.uid ?? ''}
          isReconnecting={matchSession.connection.reconnecting}
          reconnectMessage={matchSession.connection.reconnectingMessage}
          onPassTurn={matchSession.passTurn}
          onPlayCard={matchSession.playCard}
          onAttackFortress={matchSession.attackFortress}
          onDeclareAttack={matchSession.declareAttack}
          onAttackSelectionChange={matchSession.setAttackSelection}
          onTryReconnect={matchSession.tryReconnect}
        />
      ) : null}

      {step === 'resultado' ? (
        <ResultadoView
          winnerId={matchSession.events.fimDeJogo?.vencedor}
          localUserId={matchSession.session?.userId ?? authSession.authUser?.uid ?? ''}
          abandonmentDefeat={matchSession.connection.abandonmentDefeat}
          reason={matchSession.events.erroPartida?.motivo}
          onBackToLobby={matchSession.backToLobby}
        />
      ) : null}

      {matchSession.events.erroPartida ? <p style={{ color: 'crimson' }}>Erro: {matchSession.events.erroPartida.motivo}</p> : null}
    </main>
  );
}
