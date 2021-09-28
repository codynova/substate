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
	const [state, setState] = useSubState(id)
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

1. Create the api with `useCreateSubState` and pass it to a `SubStateProvider`

2. Create and subscribe to keyed values in the store from a child component. Multiple components can subscribe to the same key.

```jsx
const [state, setState] = useSubState('test')
```

3. Subscribe to the entire store by passing `undefined` for the key:

```jsx
const [state, setState] = useSubState()
```

4. Optionally pass an initial value. If two components with the same key both pass an initial value, the component that mounts
   second will overwrite the first. This works for individual keys, or the entire store (in which case the initial value must be an object).

```jsx
const [state, setState] = useSubState(undefined, { test: 1 })
const [item, setItem] = useSubState('test', 2)
```
