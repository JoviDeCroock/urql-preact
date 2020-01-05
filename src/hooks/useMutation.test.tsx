import { FunctionalComponent as FC, h } from 'preact';
import { render, cleanup, act } from '@testing-library/preact';
import { print } from 'graphql';
import gql from 'graphql-tag';
import { useMutation } from './useMutation';
import { fromValue, delay, pipe } from 'wonka';
import { Provider } from '../context';

const mock = {
  executeMutation: jest.fn(() =>
    pipe(fromValue({ data: 1, error: 2, extensions: { i: 1 } }), delay(200))
  ),
};

const client = mock as { executeMutation: jest.Mock };
const props = {
  query: 'mutation Example { example }',
};

let state: any;
let execute: any;

const MutationUser: FC<typeof props> = ({ query }) => {
  [state, execute] = useMutation(query);
  return h('p', {}, state.data);
};

beforeAll(() => {
  // eslint-disable-next-line no-console
  console.log(
    'supressing console.error output due to react-test-renderer spam (hooks related)'
  );
  jest.spyOn(global.console, 'error').mockImplementation();
});

describe('useMutation', () => {
  beforeEach(() => {
    client.executeMutation.mockClear();
    state = undefined;
    execute = undefined;
  });

  afterEach(() => cleanup());

  it('does not execute subscription', () => {
    render(
      h(Provider, {
        value: client as any,
        children: [h(MutationUser, { ...props })],
      })
    );
    expect(client.executeMutation).toBeCalledTimes(0);
  });

  it('executes mutation', () => {
    render(
      h(Provider, {
        value: client as any,
        children: [h(MutationUser, { ...props })],
      })
    );
    const vars = { test: 1234 };
    act(() => {
      execute(vars);
    });
    const call = client.executeMutation.mock.calls[0][0];
    expect(state).toHaveProperty('fetching', true);
    expect(client.executeMutation).toBeCalledTimes(1);
    expect(print(call.query)).toBe(print(gql([props.query])));
    expect(call).toHaveProperty('variables', vars);
  });

  it('respects context changes', () => {
    render(
      h(Provider, {
        value: client as any,
        children: [h(MutationUser, { ...props })],
      })
    );
    const vars = { test: 1234 };
    act(() => {
      execute(vars, { url: 'test' });
    });
    const call = client.executeMutation.mock.calls[0][1];
    expect(call.url).toBe('test');
  });

  describe('on sub update', () => {
    const vars = { test: 1234 };

    it('receives data', async () => {
      const { rerender } = render(
        h(Provider, {
          value: client as any,
          children: [h(MutationUser, { ...props })],
        })
      );
      await execute(vars);
      rerender(
        h(Provider, {
          value: client as any,
          children: [h(MutationUser, { ...props })],
        })
      );

      expect(state).toHaveProperty('data', 1);
      expect(state).toHaveProperty('error', 2);
      expect(state).toHaveProperty('extensions', { i: 1 });
      expect(state).toHaveProperty('fetching', false);
    });
  });
});