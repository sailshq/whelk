# machine-as-script

Run any machine as a command-line script.

Useful for running jobs (cron, Heroku scheduler), automating repetitive tasks (Grunt, gulp), writing one-off scripts (NPM, Chef), and building production-ready tools with command-line interfaces (e.g. `treeline`, `machinepack`).  Supports _serial command-line arguments_, command-line opts (`--`), and environment variables.


```sh
$ npm install machine-as-script --save
```

> New to Node?  Check out [**Getting Started With machine-as-script** from NPM](https://www.npmjs.com/package/machine-as-script/tutorial).


## Usage

```js
#!/usr/bin/env node

var MPMath = require('machinepack-math');

require('machine-as-script')({
  machine: MPMath.add
}).exec({
  success: function (sum){
    console.log('Got result:', sum);
  }
});
```

Now you can run your machine as a script and provide input values as command-line opts:

```sh
$ node ./add-numbers.js --a=4 --b=5
# Got result: 9
```

> Note that the machine definition you provide here doesn't have to come from an already-published machinepack-- it can be required locally from your project, or declared inline.



##### Assorted examples

It's all well and good to build command-line scripts that do simple arithmetic, but what about something more practical?  Here are a few real-world examples of `machine-as-script` in practice:

+ https://github.com/node-machine/machinepack/blob/93a7132117546ed897fa8391997d0b8aa301d6e4/bin/machinepack-browserify.js
+ https://github.com/node-machine/machinepack/blob/93a7132117546ed897fa8391997d0b8aa301d6e4/bin/machinepack-compare.js
+ https://github.com/treelinehq/treeline/blob/32b8760504c46e9816ec89a1dc8e301e0c34f62a/bin/treeline-browse.js
+ https://github.com/treelinehq/treeline/blob/763b293615e4b26339998a1384919cf958402ba8/bin/treeline-login.js



## Available Options

Aside from the [normal properties that go into a Node Machine definition](http://node-machine.org/spec), the following additional options are supported:

| Option            | Type            | Description                                            |
|:------------------|-----------------|:-------------------------------------------------------|
| `machine`         | ((dictionary?)) | If specified, `machine-as-script` will use this as the machine definition.  Otherwise by default, it expects the machine definition to be passed in at the top-level. In that case, the non-standard (machine-as-script-specific) options are omitted when the machine is built).
| `args`            | ((array?))      | The names of inputs, in order, to use for handling serial command-line arguments (more on that [below](#using-serial-command-line-arguments)).
| `envVarNamespace` | ((string?))     | The namespace to use when mapping environment variables to runtime arguments for particular inputs (more on that [below](#using-system-environment-variables)).
| `sails`           | ((SailsApp?))   | Only relevant if the machine def declares `habitat: 'sails'`.  This is the Sails app instance that will be provided to this machine as a habitat variable (`env.sails`).  In most cases, if you are using this, you'll want to set it to `require('sails').  The Sails app instance will be automatically loaded before running the machine, and automatically lowered as soon as the machine exits.



## Using serial command-line arguments

In addition to specifying inputs as `--` command-line opts, you can configure your script to accept _serial command-line arguments_.

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

Now you can use serial command-line arguments to configure the related inputs:

```sh
$ node ./add-numbers.js 4 5
# Got result: 9
```


#### Serial command-line arguments with dynamic arity

Sometimes, it's useful to be able to get _all_ serial command-line arguments, without having to declare your script's expectations beforehand.

For example, in the example above, we might want to support adding an infinite number of numbers delimited by spaces on the command line:

```sh
$ node ./add-numbers.js 4 5 10 -2382 31.482 13 48 139 13 1
```

To help you accomplish this, `machine-as-script` injects all serial command-line arguments via a special
habitat variable (`env.serialCommandLineArgs`).  Your machine can then loop over this array of strings
and behave accordingly:

```js
asScript({
  
  description: 'Sum all of the provided numbers.',

  exits: {
    
    success: {
      outputDescription: 'The sum of all the numbers that were specified via serial command-line args.',
      outputExample: 9
    },

    invalidNumber: {
      description: 'One of the provided command-line args could not be parsed as a number.'
    }

  },

  fn: function (inputs, exits, env){

    var aimErrorAt = require('aim-error-at');

    var sum = env.serialCommandLineArgs.reduce(function (memo, numberHopefully){
      var num = +numberHopefully;
      if (Number.isNaN(num)) {
        throw aimErrorAt('invalidNumber', new Error('Could not parse `'+numberHopefully+'` as a number.'));
      }
      memo += num;
      return memo;
    });

    return exits.success(sum);

  }

}).exec({
  success: function (sum){
    console.log('Got result:', sum);
  }
});
```

Note that `env.serialCommandLineArgs` is not affected by the `args` directive.  In other words, it is _always_ an
array of strings, even if the `args` directive was provided and pointed at inputs w/ different types of examples
(e.g. numbers, dictionaries, etc.).


> ###### Compatibility
>
> + This habitat variable is the evolution of the `args` input from <=v3.
> + Prior to v5, this was provided as `env.commandLineArgs` for a short period of time.




## Using system environment variables

Sometimes (particularly in a production setting, like on Heroku) you want to be able to
use your machine as a script without specifying serial command-line arguments or checking in
credentials or other configuration details to source control.  This is typically accomplished
using environment variables.

When using `machine-as-script`, as an alternative to command-line opts, you can specify input values
using environment variables:

```sh
$ ___a=4 ___b=5 node ./add-numbers.js
# Got result: 9
```

Environment variables work exactly like command-line opts, with the same escaping rules for specifying JSON arrays and dictionaries.


##### Setting a namespace

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



##### A note on case-sensitivity

Note that input code names are _case-sensitive_, and therefore the names of environment variables understood by this module are also case-sensitive.

[On Windows, the names of environment variables are capitalized/case-insensitive](https://en.wikipedia.org/wiki/Environment_variable#DOS), so you may have difficulties using this approach.  I'm happy to help in the implementation of a workaround if you need this and have any ideas for how to do it (hit me up [on Twitter](http://twitter.com/mikermcneil)).



## Configuring non-string values

So it's really easy to see how string input values can be configured using command-line opts, arguments, or environment variables.  But more often than not, when configuring a script, you need to specify an input value that _isn't_ a string-- things like arrays, dictionaries, booleans, and numbers.

This module lets you configure _any_ input value-- even lamdas.  Internally, it uses the [`parseHuman()` method from `rttc`](https://github.com/node-machine/rttc#parsehumanstringfromhuman-typeschemaundefined-unsafemodefalse).  For a more detailed look at the exact rules, check out the README in the rttc repo.  Below, we look at one example for each of the major use cases you're likely to run into.

##### Numeric inputs

```sh
$ node ./add-numbers.js --a='4' --b='5'
```

##### Boolean inputs

```sh
$ node ./divide-numbers.js --a='9' --b='5' --useFloatingPoint='false'
```

##### Lamda (`->`) inputs

```sh
$ node ./each.js --array='[]' --iteratee='function (thing){ return thing.foo; }'
```

##### Dictionary (`{}`) and array (`[]`) inputs

If an input is expecting a dictionary or array (i.e. its example is a dictionary or array), then its value should be specified as JSON.

```sh
$ node ./count-keys.js --someDictionary='{"this": {"must": ["be","JSON","encoded"]}}'
```

```sh
$ node ./count-items.js --someArray='["this","must","be","JSON","encoded","too"]'
```

##### JSON (`*`) inputs

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


##### Mutable reference (`===`) inputs

For the automatic console output of machine-as-script, mutable reference inputs work just like JSON (`*`) inputs. For custom behavior, just override the automatic handling using `.exec()`.

To learn more about rttc types, check out the [rttc README on GitHub](https://github.com/node-machine/rttc).




## Misc


##### Escaping your input values

The rules for escaping env vars, command-line opts, and serial command-line arguments can vary across operating systems.  However, a good reference point is the [escape machine in mp-process](http://node-machine.org/machinepack-process/escape).  That's what the `machinepack` command-line tool uses internally for creating code samples after a machine is run using `mp exec`.


##### Precedence

It's always best to keep things simple.  In keeping with that spirit, you should never _intentionally_ use both environment variables AND command-line opts/args to configure your script. But weird things are unavoidable, and when debugging, it's helpful to know more about the tools you use in case something jumps out.

Starting from the highest precedence, here is a list of how this module prioritizes your input configurations:

1. Serial command-line arguments (`./my-script.js bar`)
2. System environment variables (`foo=bar ./my-script.js`)
3. Command-line opts (`./my-script.js --foo='bar'`)


In other words, if you specify the same input as a serial command-line argument AND as a system environment variable or command-line opt, the serial argument will always "win".  And if you specify the same input as a system environment variable and command-line opt, the system environment variable will always win.


##### How it works

`machine-as-action` works by building a modified version of a machine instance that, when you call `.exec()`, will proxy its input values from serial command-line arguments (`myscript bar`), command-line opts (`myscript --foo='bar'`), and/or system environment variables (`___foo='bar' myscript`).

##### Conventions

You should almost always call `.exec()` immediately after using `machine-as-action`, in the same file.  If you are building a command-line tool, it is conventional to keep these files in your project's `bin/` directory (see the `treeline` and `machinepack` CLI tools on NPM for examples).

If, when you call `.exec()`, you omit a callback for a non-standard exit, the standard behavior of the machine runner applies.  If you omit `error` or `success`, machine-as-script will attempt its best guess at appropriate output by using exit metadata + introspecting runtime output.  Similarly, runtime input values are validated vs. the exemplars and requiredness in the machine's input definitions.


## Support

For more help, check out the [node-machine newsgroup](https://groups.google.com/forum/#!forum/node-machine) and [http://node-machine.org](http://node-machine.org).



## License

MIT &copy; 2015-2016 Mike McNeil, The Treeline Co.
