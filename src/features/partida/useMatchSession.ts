import { useMemo, useRef, useState } from 'react';
import { MockSocketClient, startMockServer } from '../../mock/mock-server';
import type { FlowStep, ConnectionState, MatchEventsState, MatchState, SessionState } from '../../types/app-state';
import { API_URL } from '../../config';
import {
  SocketClientService,
  createSocketClient,
  type AuraSocket,
  type MatchEventHandlers,
} from '../../services/socketClient';

const INITIAL_CONNECTION: ConnectionState = {
  connected: false,
  reconnecting: false,
  reconnectAttempts: 0,
};

function mapDeckErrorMessage(motivo?: string) {
  if (!motivo) return undefined;
  if (motivo.toLowerCase().includes('baralho inválido')) {
    return `Seu baralho está inválido para jogar. ${motivo} Abra o deck builder para corrigir (30 cartas, máximo 3 cópias).`;
  }
  return undefined;
}

type UseMatchSessionOptions = {
  initialMockMode: boolean;
  onNavigate: (step: FlowStep) => void;
  onDeckValidationError: (message: string) => void;
};

export function useMatchSession({ initialMockMode, onNavigate, onDeckValidationError }: UseMatchSessionOptions) {
  const [mockMode, setMockMode] = useState(initialMockMode);
  const [events, setEvents] = useState<MatchEventsState>({});
  const [session, setSession] = useState<SessionState | null>(null);
  const [match, setMatch] = useState<MatchState>({});
  const [connection, setConnection] = useState<ConnectionState>(INITIAL_CONNECTION);

  const socketRef = useRef<SocketClientService | null>(null);

  const status = useMemo(() => events.matchmakingStatus?.mensagem, [events.matchmakingStatus]);

  const createTransport = (newSession: SessionState): AuraSocket | MockSocketClient => {
    if (mockMode) {
      const mock = new MockSocketClient();
      startMockServer(mock, newSession.userId);
      return mock;
    }

    return createSocketClient({
      url: API_URL,
      token: newSession.token,
    });
  };

  const subscribeEvents = (service: SocketClientService, newSession: SessionState) => {
    const handlers: MatchEventHandlers = {
      onConnected: () => setConnection((prev) => ({ ...prev, connected: true, reconnecting: false })),
      onDisconnected: (reason) =>
        setConnection((prev) => ({
          ...prev,
          connected: false,
          reconnecting: true,
          reconnectingMessage: `Conexão perdida (${reason}). Tentando retorno...`,
        })),
      onReconnectAttempt: (attempt) =>
        setConnection((prev) => ({
          ...prev,
          reconnecting: true,
          reconnectAttempts: attempt,
          reconnectingMessage: `Tentativa de reconexão #${attempt}`,
        })),
      onReconnectSuccess: () =>
        setConnection((prev) => ({
          ...prev,
          connected: true,
          reconnecting: false,
          reconnectingMessage: undefined,
        })),
      onReconnectFailed: () =>
        setConnection((prev) => ({
          ...prev,
          connected: false,
          reconnecting: false,
          reconnectingMessage: 'Não foi possível reconectar.',
          abandonmentDefeat: true,
        })),
      onStatusMatchmaking: (payload) => {
        setEvents((prev) => ({ ...prev, matchmakingStatus: payload }));
        onNavigate('matchmaking');
      },
      onPartidaEncontrada: (payload) => {
        setEvents((prev) => ({ ...prev, partidaEncontrada: payload }));
        setMatch({ sala: payload.sala, estado: payload.estado });
        onNavigate('partida');
      },
      onEstadoAtualizado: (payload) => {
        setEvents((prev) => ({ ...prev, estadoAtualizado: payload }));
        setMatch((prev) => ({ ...prev, sala: payload.sala, estado: payload.estado }));
      },
      onFimDeJogo: (payload) => {
        setEvents((prev) => ({ ...prev, fimDeJogo: payload }));
        onNavigate('resultado');
      },
      onErroPartida: (payload) => {
        setEvents((prev) => ({ ...prev, erroPartida: payload }));
        const deckError = mapDeckErrorMessage(payload.motivo);
        if (deckError) {
          onDeckValidationError(deckError);
          onNavigate('deckbuilder');
          return;
        }

        if (payload.motivo.toLowerCase().includes('abandono')) {
          setConnection((prev) => ({ ...prev, abandonmentDefeat: true }));
          onNavigate('resultado');
        }
      },
    };

    service.subscribe(handlers);
    service.reconectarPartida(match.sala ?? `mock_${newSession.userId}`);
  };

  const startSession = (newSession: SessionState) => {
    socketRef.current?.disconnect();
    const transport = createTransport(newSession);
    const service = new SocketClientService(transport as any);

    socketRef.current = service;
    setSession(newSession);
    setConnection(INITIAL_CONNECTION);
    subscribeEvents(service, newSession);

    onNavigate('lobby');
  };

  const buscarPartida = (deckId: string) => {
    socketRef.current?.buscarPartida(deckId);
  };

  const passTurn = () => {
    if (!match.sala) return;
    socketRef.current?.passarTurno(match.sala);
  };

  const playCard = (cartaId: string) => {
    if (!match.sala) return;
    socketRef.current?.jogarCarta(match.sala, cartaId);
  };

  const attackFortress = (atacantesIds: string[]) => {
    if (!match.sala) return;
    socketRef.current?.atacarFortaleza(match.sala, atacantesIds);
  };

  const declareAttack = (atacanteId: string, alvoId: string) => {
    if (!match.sala) return;
    socketRef.current?.declararAtaque(match.sala, atacanteId, alvoId);
  };

  const setAttackSelection = (attackSelection: NonNullable<MatchState['attackSelection']>) => {
    setMatch((prev) => ({ ...prev, attackSelection }));
  };

  const tryReconnect = () => {
    socketRef.current?.reconectarPartida(match.sala);
    setConnection((prev) => ({ ...prev, reconnecting: true }));
  };

  const resetAfterLogout = () => {
    socketRef.current?.disconnect();
    setSession(null);
    setMatch({});
    setEvents({});
    setConnection(INITIAL_CONNECTION);
  };

  const backToLobby = () => {
    setEvents({});
    setMatch({});
    setConnection((prev) => ({ ...prev, abandonmentDefeat: false }));
    onNavigate('lobby');
  };

  return {
    mockMode,
    setMockMode,
    events,
    session,
    match,
    connection,
    status,
    startSession,
    buscarPartida,
    passTurn,
    playCard,
    attackFortress,
    declareAttack,
    setAttackSelection,
    tryReconnect,
    resetAfterLogout,
    backToLobby,
  };
}
