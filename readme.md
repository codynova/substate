# @novas/substate

1kb subscription-based state hooks for React

## Installation

```bash
yarn add @novas/substate
```

## Motivation

Allow child components to create and subscribe to keyed stateful values on a parent ContextProvider and re-render only when necessary, without
memoization at the component level. 1kb and no dependencies.

## Example

```jsx
import {
	useSubState,
	useCreateSubState,
	SubStateProvider,
} from '@novas/substate'
import { useRef, useEffect } from 'react'

const Parent = ({ children }) => {
	const api = useCreateSubState()
	return <SubStateProvider value={api}>{children}</SubStateProvider>
}

const Child = ({ id, children }) => {
	const { state, setState, store } = useSubState(id)
	const renderCount = useRef(0)
	useEffect(() => void renderCount.current++)
	return (
		<p>
			<h2>Child {id}</h2>
			<span>Render count: {renderCount.current}</span>
			<span>Current value: {state}</span>
			<button onClick={() => setState(Math.random())}>
				Re-render child {id}
			</button>
		</p>
	)
}

const Page = () => (
	<Parent>
		<Child id="1" />
		<Child id="2" />
		<Child id="3" />
		<Child id={3} />
	</Parent>
)
```

## Usage

1. `useCreateSubState` to create the store api and pass it to a `SubStateProvider`

```jsx
import { useCreateSubState, SubStateProvider } from '@novas/substate'

const MyComponent = ({ children }) => {
	const api = useCreateSubState()
	return <SubStateProvider value={api}>{children}</SubStateProvider>
}
```

2. `useSubState` to create and subscribe to keyed values in the store from a child component. Multiple components can subscribe to the same key.

```jsx
const { state, setState } = useSubState('test')
```

3. `useSubState` also returns the entire store. It will only cause re-renders when the store value with that specific key changes.

```jsx
const { state, setState, store } = useSubState('test')
// state === store.test
```

4. `setState` accepts a value or a merging function, just like React.

```jsx
setState({ hello: 'world' })
setState((currentState) => currentState++)
```

5. `useSubState` without a key will subscribe to the entire store. This will cause re-renders any time a value in the store changes, and allow setting the entire store with `setState`. **The store must be an object**

```jsx
const { state, setState, store } = useSubState()
// state === store
```

6. `useSubState` accepts an optional initial value. If two components with the same key have different initial values, the component that mounts later will overwrite the first. This works for individual keys, or the entire store. **The store must be an object**

```jsx
const [state, setState] = useSubState(undefined, { test: 1 })
const [item, setItem] = useSubState('test', 2)
```
