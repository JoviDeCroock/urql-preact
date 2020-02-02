import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { Client, createClient } from 'urql/core';

export const Context = createContext<Client>( createClient({ url: '/graphql' }));
export const Provider = Context.Provider;

export const useClient = (): Client => useContext(Context);
