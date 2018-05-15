Project template to create as simple as possible implementation of a blockchain in IoT with Node.js 4+ and JavaScript.

## Testing

To start a miner node:

```
npm install
node index.js
```

The server will start at ```localhost:8000``` by default. To start another miner node at port ```8001``` and join an existing network:

```
export PORT=8001
node node1.js
```

After ```index.js``` has been joined, its _successor_ will become ```node1.js```. To fix the default join node, please open ```node1.js``` and modify the ```join``` property:

```
server.start({
    onstart: onstart,
	onmessage: onmessage,
	join: {
		address: 'localhost',
		port: 8000
	}
});
```

## License

The source code is licensed under the MIT license found in the [LICENSE](LICENSE) file.
