export const LEGACY_PROTOCOL_VERSION = 'v1';
export const SOCKET_PROTOCOL_VERSION = 'v1.1.0';
export const SOCKET_CONTRACT_VERSION = 'v1.1.0';

export type SocketHandshakeAuth = {
  token: string;
  protocolVersion: string;
};

export type AuraCard = {
  id: string;
  nome: string;
  forca: number;
  vida: number;
};

export type EstadoPartida = {
  turno: string;
  fase: string;
  jogadores: Record<string, { vida: number; mao: AuraCard[] }>;
  campo: Record<string, AuraCard[]>;
};

type SocketPayloadBase = {
  protocolVersion: string;
  requestId: string;
  userId: string;
  sala?: string;
  matchId?: string;
};

export type StatusMatchmakingPayload = SocketPayloadBase & {
  mensagem: string;
};

export type PartidaEncontradaPayload = SocketPayloadBase & {
  sala: string;
  matchId: string;
  estado: EstadoPartida;
};

export type EstadoAtualizadoPayload = SocketPayloadBase & {
  sala: string;
  matchId: string;
  estado: EstadoPartida;
};

export type FimDeJogoPayload = SocketPayloadBase & {
  vencedor: string;
};

export type ErroPartidaPayload = SocketPayloadBase & {
  motivo: string;
};

export type SocketClientToServerEvents = {
  buscar_partida: (payload: { deckId: string }) => void;
  passar_turno: (payload: { sala: string }) => void;
  jogar_carta: (payload: { sala: string; cartaId: string }) => void;
  atacar_fortaleza: (payload: { sala: string; atacantesIds: string[] }) => void;
  declarar_ataque: (payload: { sala: string; atacanteId: string; alvoId: string }) => void;
  reconectar_partida: (payload: { sala?: string }) => void;
};

export type SocketServerToClientEvents = {
  status_matchmaking: (payload: StatusMatchmakingPayload) => void;
  partida_encontrada: (payload: PartidaEncontradaPayload) => void;
  estado_atualizado: (payload: EstadoAtualizadoPayload) => void;
  fim_de_jogo: (payload: FimDeJogoPayload) => void;
  erro_partida: (payload: ErroPartidaPayload) => void;
};
