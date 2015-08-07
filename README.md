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

asScript({
  machine: MPMath.add
}).exec({
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

In addition to specifying inputs as `--` CLI opts, you can configure your script to accept serial CLI arguments.

Just specify `args` as an array of input names, in the expected order:

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

Now you can use serial CLI arguments to configure the related inputs:

```sh
$ node ./add-numbers.js 4 5
# Got result: 9
```

#### Experimental: The `args` input

If you don't already have an input named `args`, when using machine-as-action, your machine's `fn` will receive an array of serial command-line arguments in `inputs.args`.  **THIS IS AN EXPERIMENTAL FEATURE AND COULD CHANGE AT ANY TIME WITHOUT BACKWARDS COMPATIBILITY!!**


## Using environment variables

Sometimes (particularly in a production setting, like on Heroku) you want to be able to
use your machine as a script without specifying command-line arguments or checking in
credentials or other configuration details to source control.  This is typically accomplished
using environment variables.

When using `machine-as-script`, as an alternative to CLI opts, you can specify input values
using environment variables:

```sh
$ ___a=4 ___b=5 node ./add-numbers.js
# Got result: 9
```

Environment variables work exactly like CLI opts, with the same escaping rules for specifying JSON arrays and dictionaries.

#### Setting a namespace

It's usually a good idea to namespace the environment variables specific to your application.
Especially since many inputs have fairly common names (_as they should!_), it's helpful to use a prefix to avoid conflicts with env variables used by other processes.

The default namespace is 3 underscores (`___`).  In other words, if your machine has an input `foo`, then you could configure that input using the environment variable named `___foo`.

To customize the namespace for your script, just specify an `envVarNamespace`:

```js
asScript({
  machine: MPMath.add,
  envVarNamespace: 'add_numbers__'
}).exec({
  success: function (sum){
    console.log('Got result:', sum);
  }
});
```

Now your custom string will be the expected namespace for environment variables:

```sh
$ add_numbers__a=4 add_numbers__b=5 node ./add-numbers.js
# Got result: 9
```



#### A note for Windows users
Also note that [on Windows, the names of environment variables are capitalized/case-insensitive](https://en.wikipedia.org/wiki/Environment_variable#DOS), so you may have difficulties using this approach.  I'm happy to help in the implementation of a workaround if you need this and have any ideas for how to do it (hit me up [on Twitter](http://twitter.com/mikermcneil)).


## Configuring non-string values

So it's really easy to see how string input values can be configured using CLI opts, arguments, or environment variables.  But more often than not, when configuring a script, you need to specify an input value that _isn't_ a string-- things like arrays, dictionaries, booleans, and numbers.

This module lets you configure _any_ input value-- even lamdas.  Internally, it uses the [`parseHuman()` method from `rttc`](https://github.com/node-machine/rttc#parsehumanstringfromhuman-typeschemaundefined-unsafemodefalse).  For a more detailed look at the exact rules, check out the README in the rttc repo.  Below, we look at one example for each of the major use cases you're likely to run into.

#### Numeric inputs

```sh
$ node ./add-numbers.js --a='4' --b='5'
```

#### Boolean inputs

```sh
$ node ./divide-numbers.js --a='9' --b='5' --useFloatingPoint='false'
```

#### Lamda (`->`) inputs

```sh
$ node ./each.js --array='[]' --iteratee='function (thing){ return thing.foo; }'
```

#### Dictionary (`{}`) and array (`[]`) inputs

If an input is expecting a dictionary or array (i.e. its example is a dictionary or array), then its value should be specified as JSON.

```sh
$ node ./count-keys.js --someDictionary='{"this": {"must": ["be","JSON","encoded"]}}'
```

```sh
$ node ./count-items.js --someArray='["this","must","be","JSON","encoded","too"]'
```

#### JSON (`*`) inputs

If an input is expecting generic JSON (i.e. its example is `'*'`), then its value should be specified as JSON-- even if that value is a simple string, number, or boolean.

```sh
$ node ./is-null.js --value='{w: true, x: null, y: "some string", z: 34}'
```

```sh
$ node ./is-null.js --value='["should be json encoded", 4, null]'
```

```sh
$ node ./is-null.js --value='"even if it is a string"'
```

```sh
$ node ./is-null.js --value='22353'
```

```sh
$ node ./is-null.js --value='true'
```

```sh
$ node ./is-null.js --value='null'
```


#### Mutable reference (`===`) inputs

Mutable reference inputs works just like JSON (`*`) inputs.  In other words, it isn't possible to explicitly specify `undefined` from the command-line (other than by simple omission.)

To learn more about rttc types, check out the [rttc README on GitHub](https://github.com/node-machine/rttc).

## Misc

#### Escaping your input values

The rules for escaping env vars, CLI opts, and CLI arguments can vary across operating systems.  However, a good reference point is the [escape machine in mp-process](http://node-machine.org/machinepack-process/escape).  That's what the `machinepack` command-line tool uses internally for creating code samples after a machine is run using `mp exec`.

#### Precedence

It's always best to keep things simple.  In keeping with that spirit, you should never _intentionally_ use both environment variables AND CLI opts/args to configure your script. But weird things are unavoidable, and when debugging, it's helpful to know more about the tools you use in case something jumps out.

Starting from the highest precedence, here is a list of how this module prioritizes your input configurations:

1. CLI arguments (`./my-script.js bar`)
2. Environment variables (`foo=bar ./my-script.js`)
3. CLI opts (`./my-script.js --foo='bar'`)


In other words, if you specify the same input as a CLI argument AND as an environment variable or CLI opt, the CLI argument will always "win".  And if you specify the same input as an environment variable and CLI opt, the environment variable will always win.


## License

MIT &copy; Mike McNeil
