
# Grid React Adapter

A react wrapper for the [grid](https://github.com/gridgrid/grid) library

For full documentation of features refer to the readme there as well as the typescript types which provide some self documentation. 

## Example

```jsx
import { ReactGrid } from 'grid-react-adapter'

/* Mock Data */

const cols = Array.from({ length: 100 }, () => ({}))

const rows = Array.from({ length: 1000 }, (_, rowIndex) => ({
  data: cols.map(_, columnIndex) => ({
    formatted: rowIndex + ', ' + columnIndex,
  })),
}))

rows[0].header = true
rows[0].height = 50

/* Mock Data */

class Table extends React.Component {
  render () {
    return (
      <div>
        <ReactGrid rows={rows} cols={cols} />
      </div>
    )
  }
}
```

### Props and Formats

#### Cell Data Format

```js
{
  formatted: 'formatted string' // String
}
```

#### Column Format

```js
{
  hidden: true, // Boolean
  width: 50, // Number
}
```

#### Row Format

```js
{
  data: [{ formatted: '0,0' }, { formatted: '0,1' }, ...], // Array of Cells
  header: false, // Boolean
  height: 50, // Number
}
```
  
In addition to the examples above, the full grid api can be accessed by using a ref like so:

```
class Component extends React.Component {
  setGrid = (reactGrid) => {
     if(!reactGrid){
       return;
     }
    this.grid = reactGrid.grid;
    this.grid.anyValidGridObjectOrFunction();  
     // etc..

   }
  
  render() {
    return (
      <div>
        <ReactGrid rows={rows} cols={cols} ref={this.setGrid}/>
      </div>
    );
  }
}
```

This is an escape hatch to allow full access to the grid (which is written in pure ts), but we are committed to supporting grid features in a first class React style so please open an issue for anything you think is missing from the React wrapper api and we can discuss the best way to add it in a React-y way.
