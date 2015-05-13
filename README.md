# machine-as-script


Build a modified version of a machine that proxies its inputs from CLI arguments and/or `--` opts.


```sh
$ npm install machine-as-script --save
```


## Usage

```js
#!/usr/bin/env node

var asScript = require('machine-as-script');
var MPMath = require('machinepack-math');

asScript(MPMath.add).exec({
  success: function (sum){
    console.log('Got result:', sum);
  }
});
```

Now you can run your machine as a script and provide inputs as CLI opts:

```sh
$ node ./add-numbers.js --a=4 --b=5
# Got result: 9
```

> Note that the machine definition you provide here doesn't have to come from an already-published machinepack-- it can be required locally from your project, or declared inline.



## Using serial CLI arguments

You can use the `args` input to accept serial CLI arguments:

```js
asScript({
  machine: MPMath.add,
  args: ['a', 'b']
}).exec({
  success: function (sum){
    console.log('Got result:', sum);
  }
});
```

Now you can use serial CLI arguments as inputs:

```sh
$ node ./add-numbers.js 2 3
# Got result: 5
```



## License

MIT &copy; Mike McNeil
