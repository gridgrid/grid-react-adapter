
# Grid React Adapter

A react wrapper for the [grid](https://github.com/gridgrid/grid) library

For full documentation of features refer to the readme there as well as the typescript types which provide some self documentation. 

## Example

```jsx
import { ReactGrid } from 'grid-react-adapter'

/* Mock Data */

const cols = Array.from({ length: 100 }, () => ({}))

const rows = Array.from({ length: 1000 }, (_, rowIndex) => ({
  data: cols.map((_, columnIndex) => ({
      formatted: rowIndex + ', ' + columnIndex,
      value: rowIndex + ', ' + columnIndex,
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

- `rows` row options, see Row format
- `cols` column options, see Col format
- `ref` access the component and wrapped `grid`
- `cellRenderer`: `(context : {virtualRow: number, virtualCol: number, data: IGridDataResult<any>}) => ReactElement<any> | string | undefined` render prop called for each visible cell (where cell doesn't include headers)
- `headerCellRenderer` : `(context : {virtualRow: number, virtualCol: number, data: IGridDataResult<any>}) => ReactElement<any> | string | undefined` render prop called for each visible header cell


Props derived form the core grid options object:
```
{
    // controls whether the scroll is smooth or snaps to cell boundaries
    snapToCell?: boolean; 
    
    // setting to true will enable the editModel to function, which by default is text only editing
    allowEdit?: boolean; 
    
    /* a function the grid calls to let you know it thinks you should fetch more data 
     based on the current scroll position, called when using the default datamodel */
    loadRows?: RowLoader; // (rowIndexes : number[]) => void
    
     // options for column specific behaviors
    col?: {
       // disables the drag and drop column reordering functionality
        disableReorder?: boolean; 
    };
}
```
#### Cell Data Format

```js
{
 // for your own reference or mainly for copy paste to enable pasting of rich data beyond just the string representation
  value? : any 
  
  // the display representation of the value for this cell
  formatted: string 
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

### Accessing the Grid Instance

In addition to the examples above, the full grid api can be accessed by using a ref like so:

```jsx
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
